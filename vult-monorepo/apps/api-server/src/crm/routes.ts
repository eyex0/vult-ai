import { Router, type Request, type Response } from 'express';
import { z, ZodError } from 'zod';
import { normalizePhone } from '@vult/arabic';
import { Prisma, withTenantContext, type PrismaClient } from '@vult/database';
import { asyncRoute } from '../http.js';
import { requireWriteAccess } from '../middleware/tenantIsolation.js';
import {
  activityInput, blank, companyInput, CRM_KINDS, dealInput, INPUTS, noteInput, personInput, taskInput,
  toActivity, toCompany, toDeal, toNote, toPerson, toTask, type CrmKind, type RecordKind,
} from './dto.js';
import { searchConditions, searchTextOf } from './search.js';

type Tx = PrismaClient;
type Row = Record<string, unknown> & { id: string };

/** A request that is valid JSON but names something the workspace does not have. */
class CrmError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

// One generic path for the five kinds: the Prisma delegates share these calls.
interface Delegate {
  findMany(args: object): Promise<Row[]>;
  findFirst(args: object): Promise<Row | null>;
  create(args: object): Promise<Row>;
  update(args: object): Promise<Row>;
  updateMany(args: object): Promise<{ count: number }>;
}
const MODEL = { companies: 'company', people: 'person', deals: 'deal', tasks: 'task', notes: 'note' } as const;
const delegate = (tx: Tx, kind: CrmKind) => tx[MODEL[kind]] as unknown as Delegate;
const TO = { companies: toCompany, people: toPerson, deals: toDeal, tasks: toTask, notes: toNote } as unknown as Record<CrmKind, (r: Row) => object>;
const SINGULAR: Record<RecordKind, string> = { companies: 'Company', people: 'Person', deals: 'Deal' };

/** Sorts are keyset-paginated on (column, id), so only non-null columns are offered. */
const SORTS: Record<CrmKind, readonly string[]> = {
  companies: ['updatedAt', 'createdAt', 'name'],
  people: ['updatedAt', 'createdAt', 'name'],
  deals: ['updatedAt', 'createdAt', 'name', 'stage', 'value'],
  tasks: ['updatedAt', 'createdAt', 'title'],
  notes: ['updatedAt', 'createdAt', 'title'],
};
const DATE_SORTS = new Set(['updatedAt', 'createdAt']);

type FilterType = 'text' | 'number' | 'bool' | 'id';
const FILTERS: Record<CrmKind, Record<string, FilterType>> = {
  companies: { name: 'text', domain: 'text', industry: 'text', segment: 'text', city: 'text', country: 'text', employees: 'number', arr: 'number', ownerId: 'id' },
  people: { name: 'text', email: 'text', title: 'text', city: 'text', strength: 'text', companyId: 'id', ownerId: 'id' },
  deals: { name: 'text', stage: 'text', source: 'text', value: 'number', companyId: 'id', ownerId: 'id' },
  tasks: { title: 'text', priority: 'text', done: 'bool', assigneeId: 'id' },
  notes: { title: 'text', pinned: 'bool', authorId: 'id' },
};
const filterRule = z.object({ key: z.string(), op: z.enum(['contains', 'is', 'gt', 'lt']), value: z.string().max(200) });

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  cursor: z.string().max(1000).optional(),
  sort: z.string().optional(),
  dir: z.enum(['asc', 'desc']).default('desc'),
  q: z.string().trim().max(200).optional(),
  filter: z.string().max(4000).optional(),
  record: z.string().regex(/^(companies|people|deals):[0-9a-f-]{36}$/i).optional(),
});
type ListQuery = z.infer<typeof listQuery>;

const idsBody = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) });
const uuid = z.string().uuid();
const ROLE = { ADMIN: 'Admin', MANAGER: 'Member', MEMBER: 'Member', READ_ONLY: 'Guest' } as const;
const OPEN_STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation'];

const cursorValue = (v: unknown) => (v instanceof Date ? v.toISOString() : typeof v === 'object' && v !== null ? String(v) : v);
const encodeCursor = (v: unknown, id: string) => Buffer.from(JSON.stringify([cursorValue(v), id])).toString('base64url');
function decodeCursor(cursor: string): [unknown, string] {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (Array.isArray(parsed) && parsed.length === 2 && typeof parsed[1] === 'string') return [parsed[0], parsed[1]];
  } catch {
    /* falls through */
  }
  throw new CrmError(400, 'Invalid cursor');
}

function parseFilters(kind: CrmKind, raw: string | undefined): object[] {
  if (!raw) return [];
  let rules;
  try {
    rules = z.array(filterRule).max(20).parse(JSON.parse(raw));
  } catch {
    throw new CrmError(400, 'Invalid filter');
  }
  return rules.map(({ key, op, value }) => {
    const type = FILTERS[kind][key];
    if (!type) throw new CrmError(400, `Cannot filter by ${key}`);
    if (type === 'text') {
      if (op === 'contains') return { [key]: { contains: value, mode: 'insensitive' } };
      if (op === 'is') return { [key]: { equals: value, mode: 'insensitive' } };
    } else if (type === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n)) throw new CrmError(400, `${key} needs a number`);
      return { [key]: op === 'gt' ? { gt: n } : op === 'lt' ? { lt: n } : { equals: n } };
    } else if (type === 'bool' && op === 'is') {
      return { [key]: value === 'true' };
    } else if (type === 'id' && op === 'is') {
      if (!uuid.safeParse(value).success) throw new CrmError(400, `${key} needs an id`);
      return { [key]: value };
    }
    throw new CrmError(400, `Operator ${op} does not apply to ${key}`);
  });
}

async function listRecords(tx: Tx, kind: CrmKind, query: ListQuery) {
  const sort = query.sort && SORTS[kind].includes(query.sort) ? query.sort : 'updatedAt';
  const dir = query.dir;
  const where: object[] = [{ deletedAt: null }];
  if (query.q) {
    where.push(...(kind === 'tasks' || kind === 'notes' ? [{ title: { contains: query.q, mode: 'insensitive' } }] : searchConditions(query.q)));
  }
  if (query.record && (kind === 'tasks' || kind === 'notes')) {
    const [recordKind, recordId] = query.record.split(':');
    where.push({ recordKind, recordId: recordId!.toLowerCase() });
  }
  where.push(...parseFilters(kind, query.filter));
  if (query.cursor) {
    const [raw, id] = decodeCursor(query.cursor);
    const value = DATE_SORTS.has(sort) ? new Date(String(raw)) : raw;
    const cmp = dir === 'desc' ? 'lt' : 'gt';
    where.push({ OR: [{ [sort]: { [cmp]: value } }, { [sort]: value, id: { [cmp]: id } }] });
  }
  const rows = await delegate(tx, kind).findMany({ where: { AND: where }, orderBy: [{ [sort]: dir }, { id: dir }], take: query.limit + 1 });
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  return {
    data: page.map(TO[kind]),
    nextCursor: rows.length > query.limit && last ? encodeCursor(last[sort], last.id) : null,
  };
}

async function checkMember(tx: Tx, id: string | null | undefined) {
  if (id && !(await tx.user.findFirst({ where: { id }, select: { id: true } }))) throw new CrmError(400, 'Unknown member');
}

/** Row-level security hides other workspaces' rows, so a reference into another workspace is "unknown" here. */
async function checkRecord(tx: Tx, kind: RecordKind, id: string | null | undefined) {
  if (!id) return null;
  const found = await delegate(tx, kind).findFirst({ where: { id, deletedAt: null } });
  if (!found) throw new CrmError(400, `Unknown ${SINGULAR[kind].toLowerCase()}`);
  return found;
}

/** Copies the fields that were sent; '' and null clear a field. */
function pick(data: Record<string, unknown>, key: string, value: unknown) {
  if (value !== undefined) data[key] = value;
}
const dateOrNull = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);
const phoneOf = (v: string | null | undefined) => (v ? (normalizePhone(v, 'SA')?.e164 ?? v) : v);

/** Builds the columns to write from a validated body, and the search text from the merged record. */
async function writeData(tx: Tx, kind: CrmKind, body: Record<string, unknown>, existing: Row | null) {
  const data: Record<string, unknown> = {};
  const merged = (key: string) => (key in data ? data[key] : existing?.[key]) as string | null | undefined;
  if (kind === 'companies') {
    const i = body as z.infer<typeof companyInput>;
    for (const key of ['name', 'domain', 'industry', 'segment', 'currency', 'taxId', 'city', 'country', 'description', 'ownerId'] as const) pick(data, key, blank(i[key]));
    pick(data, 'employees', i.employees);
    pick(data, 'arr', i.arr);
    pick(data, 'custom', i.custom);
    pick(data, 'lastInteractionAt', i.lastInteraction ? new Date(i.lastInteraction) : undefined);
    await checkMember(tx, data.ownerId as string | null | undefined);
    data.searchText = searchTextOf(merged('name'), merged('domain'), merged('city'), merged('country'), merged('industry'), merged('taxId'));
  } else if (kind === 'people') {
    const i = body as z.infer<typeof personInput>;
    for (const key of ['name', 'email', 'title', 'companyId', 'city', 'strength', 'ownerId'] as const) pick(data, key, blank(i[key]));
    pick(data, 'phone', phoneOf(blank(i.phone)));
    pick(data, 'custom', i.custom);
    pick(data, 'lastInteractionAt', i.lastInteraction ? new Date(i.lastInteraction) : undefined);
    await checkMember(tx, data.ownerId as string | null | undefined);
    await checkRecord(tx, 'companies', data.companyId as string | null | undefined);
    data.searchText = searchTextOf(merged('name'), merged('email'), merged('title'), merged('city'), merged('phone'));
  } else if (kind === 'deals') {
    const i = body as z.infer<typeof dealInput>;
    for (const key of ['name', 'companyId', 'stage', 'currency', 'source', 'nextStep', 'ownerId'] as const) pick(data, key, blank(i[key]));
    pick(data, 'personId', blank(i.contactId));
    pick(data, 'value', i.value);
    pick(data, 'closeDate', dateOrNull(blank(i.closeDate)));
    pick(data, 'custom', i.custom);
    await checkMember(tx, data.ownerId as string | null | undefined);
    await checkRecord(tx, 'people', data.personId as string | null | undefined);
    const company = await checkRecord(tx, 'companies', merged('companyId'));
    data.searchText = searchTextOf(merged('name'), company?.name as string | undefined, merged('nextStep'));
  } else if (kind === 'tasks') {
    const i = body as z.infer<typeof taskInput>;
    pick(data, 'title', i.title);
    pick(data, 'dueAt', dateOrNull(blank(i.due)));
    pick(data, 'assigneeId', blank(i.assigneeId));
    pick(data, 'done', i.done);
    pick(data, 'priority', i.priority);
    if (i.record !== undefined) {
      data.recordKind = i.record?.kind ?? null;
      data.recordId = i.record?.id ?? null;
      if (i.record) await checkRecord(tx, i.record.kind, i.record.id);
    }
    await checkMember(tx, data.assigneeId as string | null | undefined);
  } else {
    const i = body as z.infer<typeof noteInput>;
    pick(data, 'title', i.title);
    pick(data, 'body', i.body);
    pick(data, 'pinned', i.pinned);
    pick(data, 'authorId', blank(i.authorId));
    if (i.record !== undefined) {
      data.recordKind = i.record?.kind ?? null;
      data.recordId = i.record?.id ?? null;
      if (i.record) await checkRecord(tx, i.record.kind, i.record.id);
    }
    await checkMember(tx, data.authorId as string | null | undefined);
  }
  return data;
}

/** The member a new record belongs to when the body does not say. */
const OWNER_FIELD: Record<CrmKind, string> = { companies: 'ownerId', people: 'ownerId', deals: 'ownerId', tasks: 'assigneeId', notes: 'authorId' };

async function createRecord(tx: Tx, tenantId: string, userId: string, kind: CrmKind, raw: unknown) {
  const body = INPUTS[kind].parse(raw) as Record<string, unknown> & { id?: string };
  if (body[OWNER_FIELD[kind]] === undefined) body[OWNER_FIELD[kind]] = userId;
  const data = await writeData(tx, kind, body, null);
  const row = await delegate(tx, kind).create({ data: { ...data, ...(body.id ? { id: body.id } : {}), tenantId } });
  if (kind === 'companies' || kind === 'people' || kind === 'deals') {
    await tx.activity.create({ data: { tenantId, recordKind: kind, recordId: row.id, kind: 'created', text: `${SINGULAR[kind]} created`, actorId: userId } });
  }
  return TO[kind](row);
}

async function updateRecord(tx: Tx, tenantId: string, userId: string, kind: CrmKind, id: string, raw: unknown) {
  const existing = await delegate(tx, kind).findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new CrmError(404, 'Not found');
  const { id: _ignored, ...body } = INPUTS[kind].partial().parse(raw) as Record<string, unknown>;
  const data = await writeData(tx, kind, body, existing);
  const row = await delegate(tx, kind).update({ where: { id }, data });
  if (kind === 'deals' && typeof data.stage === 'string' && data.stage !== existing.stage) {
    await tx.activity.create({ data: { tenantId, recordKind: 'deals', recordId: id, kind: 'stage', text: `Stage changed to ${data.stage}`, actorId: userId } });
  }
  return TO[kind](row);
}

function fail(res: Response, error: unknown) {
  if (error instanceof CrmError) return void res.status(error.status).json({ error: error.message });
  if (error instanceof ZodError) return void res.status(400).json({ error: 'Invalid request', fields: error.flatten().fieldErrors });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return void res.status(409).json({ error: 'A record with this id already exists' });
  throw error;
}

const kindOf = (req: Request) => {
  const kind = req.params.kind as CrmKind;
  if (!CRM_KINDS.includes(kind)) throw new CrmError(404, 'Unknown object');
  return kind;
};

/** CRM records of the signed-in workspace. Every query runs inside the workspace's row-level-security context. */
export function crmRouter(): Router {
  const r = Router();
  const inTenant = <T>(req: Request, fn: (tx: Tx) => Promise<T>) => withTenantContext(req.tenant.tenantId, fn);

  r.get('/members', asyncRoute(async (req, res) => {
    const users = await inTenant(req, (tx) => tx.user.findMany({ select: { id: true, name: true, email: true, role: true }, orderBy: { createdAt: 'asc' } }));
    res.json({ success: true, me: req.tenant.userId, data: users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: ROLE[u.role], title: '' })) });
  }));

  /** Pipeline totals computed in the database, whatever the number of deals. */
  r.get('/summary', asyncRoute(async (req, res) => {
    const groups = await inTenant(req, (tx) => tx.deal.groupBy({ by: ['stage'], where: { deletedAt: null }, _sum: { value: true }, _count: { _all: true } }));
    const sum = (stages: string[]) => groups.filter((g) => stages.includes(g.stage));
    const open = sum(OPEN_STAGES);
    const won = sum(['Won']);
    const lost = sum(['Lost']);
    const total = (gs: typeof groups) => gs.reduce((a, g) => a + Number(g._sum.value ?? 0), 0);
    const count = (gs: typeof groups) => gs.reduce((a, g) => a + g._count._all, 0);
    const decided = count(won) + count(lost);
    res.json({
      success: true,
      openValue: total(open), openCount: count(open), wonValue: total(won), wonCount: count(won),
      winRate: decided ? count(won) / decided : 0,
      stages: groups.map((g) => ({ stage: g.stage, count: g._count._all, value: Number(g._sum.value ?? 0) })),
    });
  }));

  r.get('/activities', asyncRoute(async (req, res) => {
    try {
      const q = z.object({
        record: z.string().regex(/^(companies|people|deals):[0-9a-f-]{36}$/i).optional(),
        limit: z.coerce.number().int().min(1).max(500).default(100),
        cursor: z.string().max(1000).optional(),
      }).parse(req.query);
      const result = await inTenant(req, async (tx) => {
        const where: object[] = [];
        if (q.record) {
          const [recordKind, recordId] = q.record.split(':');
          where.push({ recordKind, recordId: recordId!.toLowerCase() });
        }
        if (q.cursor) {
          const [at, id] = decodeCursor(q.cursor);
          where.push({ OR: [{ at: { lt: new Date(String(at)) } }, { at: new Date(String(at)), id: { lt: id } }] });
        }
        const rows = await tx.activity.findMany({ where: { AND: where }, orderBy: [{ at: 'desc' }, { id: 'desc' }], take: q.limit + 1 });
        const page = rows.slice(0, q.limit);
        const last = page.at(-1);
        return { data: page.map(toActivity), nextCursor: rows.length > q.limit && last ? encodeCursor(last.at, last.id) : null };
      });
      res.json({ success: true, ...result });
    } catch (error) {
      fail(res, error);
    }
  }));

  r.post('/activities', requireWriteAccess, asyncRoute(async (req, res) => {
    try {
      const body = activityInput.parse(req.body);
      const row = await inTenant(req, async (tx) => {
        await checkRecord(tx, body.record.kind, body.record.id);
        return tx.activity.create({
          data: { tenantId: req.tenant.tenantId, recordKind: body.record.kind, recordId: body.record.id, kind: body.kind, text: body.text, actorId: req.tenant.userId },
        });
      });
      res.status(201).json({ success: true, data: toActivity(row) });
    } catch (error) {
      fail(res, error);
    }
  }));

  r.get('/:kind', asyncRoute(async (req, res) => {
    try {
      const kind = kindOf(req);
      const query = listQuery.parse(req.query);
      const result = await inTenant(req, (tx) => listRecords(tx, kind, query));
      res.json({ success: true, ...result });
    } catch (error) {
      fail(res, error);
    }
  }));

  r.get('/:kind/:id', asyncRoute(async (req, res) => {
    try {
      const kind = kindOf(req);
      const id = uuid.parse(req.params.id);
      const row = await inTenant(req, (tx) => delegate(tx, kind).findFirst({ where: { id, deletedAt: null } }));
      if (!row) return void res.status(404).json({ error: 'Not found' });
      res.json({ success: true, data: TO[kind](row) });
    } catch (error) {
      fail(res, error);
    }
  }));

  r.post('/:kind', requireWriteAccess, asyncRoute(async (req, res) => {
    try {
      const kind = kindOf(req);
      const data = await inTenant(req, (tx) => createRecord(tx, req.tenant.tenantId, req.tenant.userId, kind, req.body));
      res.status(201).json({ success: true, data });
    } catch (error) {
      fail(res, error);
    }
  }));

  r.patch('/:kind/:id', requireWriteAccess, asyncRoute(async (req, res) => {
    try {
      const kind = kindOf(req);
      const id = uuid.parse(req.params.id);
      const data = await inTenant(req, (tx) => updateRecord(tx, req.tenant.tenantId, req.tenant.userId, kind, id, req.body));
      res.json({ success: true, data });
    } catch (error) {
      fail(res, error);
    }
  }));

  /** Soft delete: the rows leave every list and can be restored (the Undo in the workspace). */
  r.post('/:kind/delete', requireWriteAccess, asyncRoute(async (req, res) => {
    try {
      const kind = kindOf(req);
      const { ids } = idsBody.parse(req.body);
      const result = await inTenant(req, (tx) => delegate(tx, kind).updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { deletedAt: new Date() } }));
      res.json({ success: true, deleted: result.count });
    } catch (error) {
      fail(res, error);
    }
  }));

  r.post('/:kind/restore', requireWriteAccess, asyncRoute(async (req, res) => {
    try {
      const kind = kindOf(req);
      const { ids } = idsBody.parse(req.body);
      const result = await inTenant(req, (tx) => delegate(tx, kind).updateMany({ where: { id: { in: ids }, deletedAt: { not: null } }, data: { deletedAt: null } }));
      res.json({ success: true, restored: result.count });
    } catch (error) {
      fail(res, error);
    }
  }));

  return r;
}

