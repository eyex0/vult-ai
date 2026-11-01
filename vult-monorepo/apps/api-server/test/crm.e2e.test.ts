import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Runs only against a disposable database: VULT_E2E=1 with DATABASE_URL (app role, RLS enforced) and JWT_SECRET.
const enabled = process.env.VULT_E2E === '1';

type Json = Record<string, any>;

describe.skipIf(!enabled)('crm', () => {
  let base = '';
  let close = () => {};

  beforeAll(async () => {
    const { app } = await import('../src/app.js');
    const server = app.listen(0);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
    close = () => server.close();
  });
  afterAll(() => close());

  /** Signs up a fresh workspace and returns a small client bound to its session cookie. */
  async function workspace(name: string) {
    const email = `owner-${crypto.randomUUID().slice(0, 8)}@example.com`;
    const res = await fetch(`${base}/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'سارة', email, password: 'correct horse battery', workspace: name }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as Json;
    const cookie = (res.headers.get('set-cookie') ?? '').split(';')[0]!;
    const call = async (method: string, path: string, json?: unknown, csrf = true) => {
      const r = await fetch(`${base}/crm${path}`, {
        method,
        headers: { cookie, ...(csrf ? { 'x-vult-csrf': '1' } : {}), ...(json === undefined ? {} : { 'content-type': 'application/json' }) },
        body: json === undefined ? undefined : JSON.stringify(json),
      });
      return { status: r.status, body: (await r.json()) as Json };
    };
    return { userId: body.user.id as string, call };
  }

  let a: Awaited<ReturnType<typeof workspace>>;
  let b: Awaited<ReturnType<typeof workspace>>;
  let companyId = '';
  let personId = '';
  let dealId = '';

  beforeAll(async () => {
    a = await workspace('النخلة للحلول');
    b = await workspace('Other Workspace');
  });

  it('creates Arabic records owned by the signed-in member, with phones in international form', async () => {
    const company = await a.call('POST', '/companies', { name: 'مجموعة الواحة للتقنية', domain: 'alwaha.example', city: 'الرياض', country: 'السعودية', currency: 'SAR', arr: 382000 });
    expect(company.status).toBe(201);
    expect(company.body.data).toMatchObject({ name: 'مجموعة الواحة للتقنية', ownerId: a.userId, currency: 'SAR', arr: 382000 });
    companyId = company.body.data.id;

    const person = await a.call('POST', '/people', { name: 'محمد عبدالله الشهري', email: 'mohamed@alwaha.example', companyId, phone: '٠٥٠١٢٣٤٥٦٧' });
    expect(person.status).toBe(201);
    expect(person.body.data).toMatchObject({ companyId, phone: '+966501234567', ownerId: a.userId });
    personId = person.body.data.id;

    const id = crypto.randomUUID();
    const deal = await a.call('POST', '/deals', { id, name: 'إطلاق المنصة', companyId, contactId: personId, stage: 'Lead', value: 75000.5, closeDate: '2026-12-15' });
    expect(deal.status).toBe(201);
    expect(deal.body.data).toMatchObject({ id, contactId: personId, stage: 'Lead', value: 75000.5, closeDate: '2026-12-15T12:00:00.000Z' });
    dealId = id;
  });

  it('keeps every workspace to its own records', async () => {
    expect((await a.call('GET', '/companies')).body.data.map((c: Json) => c.id)).toEqual([companyId]);
    expect((await b.call('GET', '/companies')).body.data).toEqual([]);
    expect((await b.call('GET', `/companies/${companyId}`)).status).toBe(404);
    expect((await b.call('PATCH', `/companies/${companyId}`, { name: 'Taken' })).status).toBe(404);
    // A reference into another workspace is refused, not silently linked.
    const stolen = await b.call('POST', '/people', { name: 'X', companyId });
    expect(stolen.status).toBe(400);
    expect(stolen.body.error).toBe('Unknown company');
    expect((await b.call('POST', '/companies/delete', { ids: [companyId] })).body.deleted).toBe(0);
    expect((await a.call('GET', `/companies/${companyId}`)).status).toBe(200);
  });

  it('finds Arabic names with or without diacritics and from Latin spellings', async () => {
    const find = async (q: string) => (await a.call('GET', `/people?q=${encodeURIComponent(q)}`)).body.data.map((p: Json) => p.id);
    expect(await find('mohamed shehri')).toEqual([personId]);
    expect(await find('مُحَمَّد')).toEqual([personId]);
    expect(await find('الشهري')).toEqual([personId]);
    expect(await find('fatma')).toEqual([]);
    expect((await a.call('GET', `/deals?q=${encodeURIComponent('الواحة')}`)).body.data.map((d: Json) => d.id)).toEqual([dealId]);
  });

  it('pages through large lists with a stable cursor', async () => {
    for (const name of ['ألفا', 'باء', 'تاء', 'ثاء', 'جيم', 'حاء', 'خاء']) {
      expect((await a.call('POST', '/companies', { name })).status).toBe(201);
    }
    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page = await a.call('GET', `/companies?limit=3&sort=name&dir=asc${cursor ? `&cursor=${cursor}` : ''}`);
      expect(page.status).toBe(200);
      seen.push(...page.body.data.map((c: Json) => c.id));
      cursor = page.body.nextCursor;
      pages++;
    } while (cursor && pages < 10);
    expect(pages).toBe(3);
    expect(new Set(seen).size).toBe(8);
  });

  it('logs creation and stage changes on the record timeline', async () => {
    const won = await a.call('PATCH', `/deals/${dealId}`, { stage: 'Won' });
    expect(won.body.data.stage).toBe('Won');
    const timeline = await a.call('GET', `/activities?record=deals:${dealId}`);
    expect(timeline.body.data.map((x: Json) => x.kind)).toEqual(['stage', 'created']);
    const summary = await a.call('GET', '/summary');
    expect(summary.body).toMatchObject({ wonCount: 1, wonValue: 75000.5, winRate: 1, openCount: 0 });
  });

  it('soft-deletes and restores, so Undo works', async () => {
    expect((await a.call('POST', '/companies/delete', { ids: [companyId] })).body.deleted).toBe(1);
    expect((await a.call('GET', `/companies/${companyId}`)).status).toBe(404);
    expect((await a.call('POST', '/companies/restore', { ids: [companyId] })).body.restored).toBe(1);
    expect((await a.call('GET', `/companies/${companyId}`)).status).toBe(200);
  });

  it('attaches tasks and notes to records', async () => {
    const task = await a.call('POST', '/tasks', { title: 'متابعة العرض', due: '2026-11-05T17:00:00.000Z', record: { kind: 'deals', id: dealId } });
    expect(task.status).toBe(201);
    expect(task.body.data).toMatchObject({ assigneeId: a.userId, done: false, priority: 'Medium', record: { kind: 'deals', id: dealId } });
    const note = await a.call('POST', '/notes', { title: 'ملاحظات المكالمة', body: '## ملخص', record: { kind: 'companies', id: companyId } });
    expect(note.body.data).toMatchObject({ authorId: a.userId, pinned: false });
    expect((await a.call('GET', `/tasks?record=deals:${dealId}`)).body.data).toHaveLength(1);
    expect((await b.call('POST', '/tasks', { title: 'x', record: { kind: 'deals', id: dealId } })).status).toBe(400);
  });

  it('validates input and requires the CSRF header for cookie writes', async () => {
    expect((await a.call('POST', '/companies', { name: '' })).status).toBe(400);
    expect((await a.call('POST', '/companies', { name: 'X', currency: 'riyal' })).status).toBe(400);
    expect((await a.call('POST', '/people', { name: 'X', email: 'not-an-email' })).status).toBe(400);
    expect((await a.call('PATCH', `/deals/${crypto.randomUUID()}`, { stage: 'Won' })).status).toBe(404);
    expect((await a.call('GET', '/widgets')).status).toBe(404);
    expect((await a.call('POST', '/companies', { name: 'No CSRF' }, false)).status).toBe(403);
    expect((await a.call('POST', '/companies', { id: companyId, name: 'Duplicate' })).status).toBe(409);
  });

  it('lists the workspace members and who is signed in', async () => {
    const members = await a.call('GET', '/members');
    expect(members.body.me).toBe(a.userId);
    expect(members.body.data).toEqual([expect.objectContaining({ id: a.userId, role: 'Admin' })]);
  });
});
