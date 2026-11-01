import { z } from 'zod';
import type { Activity, Company, Deal, Note, Person, Task } from '@vult/database';

/**
 * The CRM speaks the same record shapes as the workspace UI (companies, people, deals, tasks, notes and the
 * activity timeline), so the browser and the agents read and write one format. Empty strings clear a field.
 */

export const RECORD_KINDS = ['companies', 'people', 'deals'] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];
export const CRM_KINDS = ['companies', 'people', 'deals', 'tasks', 'notes'] as const;
export type CrmKind = (typeof CRM_KINDS)[number];

const MAX_CUSTOM_BYTES = 20_000;

const text = (max: number) => z.string().trim().max(max);
/** Optional text: absent = unchanged, '' or null = cleared. */
const optText = (max: number) => text(max).nullable().optional();
const ref = z.union([z.string().uuid(), z.literal(''), z.null()]).optional();
const money = z.number().finite().min(0).max(1e15);
const currency = z.union([z.string().regex(/^[A-Z]{3}$/), z.literal(''), z.null()]).optional();
const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date');
const custom = z
  .record(z.unknown())
  .refine((v) => JSON.stringify(v).length <= MAX_CUSTOM_BYTES, 'Custom fields are too large')
  .optional();
const recordRef = z.object({ kind: z.enum(RECORD_KINDS), id: z.string().uuid() });

export const companyInput = z.object({
  id: z.string().uuid().optional(),
  name: text(200).min(1),
  domain: optText(253),
  industry: optText(80),
  segment: optText(80),
  employees: z.number().int().min(0).max(10_000_000).nullable().optional(),
  arr: money.nullable().optional(),
  currency,
  taxId: optText(40),
  city: optText(120),
  country: optText(120),
  description: optText(4000),
  ownerId: ref,
  custom,
  lastInteraction: isoDate.optional(),
});

export const personInput = z.object({
  id: z.string().uuid().optional(),
  name: text(200).min(1),
  email: z.union([z.string().trim().email().max(254), z.literal(''), z.null()]).optional(),
  title: optText(160),
  companyId: ref,
  phone: optText(40),
  city: optText(120),
  strength: optText(40),
  ownerId: ref,
  custom,
  lastInteraction: isoDate.optional(),
});

export const dealInput = z.object({
  id: z.string().uuid().optional(),
  name: text(200).min(1),
  companyId: ref,
  contactId: ref,
  stage: text(60).min(1).optional(),
  value: money.optional(),
  currency,
  ownerId: ref,
  closeDate: z.union([isoDate, z.literal(''), z.null()]).optional(),
  source: optText(60),
  nextStep: optText(500),
  custom,
});

export const taskInput = z.object({
  id: z.string().uuid().optional(),
  title: text(500).min(1),
  due: z.union([isoDate, z.literal(''), z.null()]).optional(),
  assigneeId: ref,
  done: z.boolean().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  record: recordRef.nullable().optional(),
});

export const noteInput = z.object({
  id: z.string().uuid().optional(),
  title: text(300).min(1),
  body: z.string().max(100_000).optional(),
  record: recordRef.nullable().optional(),
  authorId: ref,
  pinned: z.boolean().optional(),
});

export const activityInput = z.object({
  record: recordRef,
  kind: z.enum(['email', 'meeting', 'call', 'stage', 'note', 'enrich', 'created', 'task', 'agent', 'whatsapp']),
  text: text(1000).min(1),
});

export const INPUTS = { companies: companyInput, people: personInput, deals: dealInput, tasks: taskInput, notes: noteInput } as const;

/** '' and null both mean "none" for optional text and references. */
export const blank = <T>(v: T | '' | null | undefined): T | null | undefined => (v === undefined ? undefined : v === '' || v === null ? null : v);

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : undefined);
const day = (d: Date | null) => (d ? `${d.toISOString().slice(0, 10)}T12:00:00.000Z` : undefined);
const recordOf = (kind: string | null, id: string | null) => (kind && id ? { kind, id } : undefined);

export const toCompany = (r: Company) => ({
  id: r.id,
  name: r.name,
  domain: r.domain ?? '',
  industry: r.industry ?? '',
  segment: r.segment ?? '',
  employees: r.employees ?? 0,
  arr: r.arr === null ? 0 : Number(r.arr),
  currency: r.currency ?? undefined,
  taxId: r.taxId ?? undefined,
  city: r.city ?? '',
  country: r.country ?? '',
  ownerId: r.ownerId ?? '',
  description: r.description ?? '',
  custom: r.custom,
  createdAt: r.createdAt.toISOString(),
  lastInteraction: (r.lastInteractionAt ?? r.updatedAt).toISOString(),
});

export const toPerson = (r: Person) => ({
  id: r.id,
  name: r.name,
  email: r.email ?? '',
  title: r.title ?? '',
  companyId: r.companyId ?? '',
  phone: r.phone ?? '',
  city: r.city ?? '',
  strength: r.strength ?? 'Medium',
  ownerId: r.ownerId ?? '',
  custom: r.custom,
  createdAt: r.createdAt.toISOString(),
  lastInteraction: (r.lastInteractionAt ?? r.updatedAt).toISOString(),
});

export const toDeal = (r: Deal) => ({
  id: r.id,
  name: r.name,
  companyId: r.companyId ?? '',
  contactId: r.personId ?? undefined,
  stage: r.stage,
  value: Number(r.value),
  currency: r.currency ?? undefined,
  ownerId: r.ownerId ?? '',
  closeDate: day(r.closeDate) ?? r.createdAt.toISOString(),
  source: r.source ?? '',
  nextStep: r.nextStep ?? '',
  custom: r.custom,
  createdAt: r.createdAt.toISOString(),
});

export const toTask = (r: Task) => ({
  id: r.id,
  title: r.title,
  due: iso(r.dueAt),
  assigneeId: r.assigneeId ?? '',
  done: r.done,
  priority: r.priority,
  record: recordOf(r.recordKind, r.recordId),
  createdAt: r.createdAt.toISOString(),
});

export const toNote = (r: Note) => ({
  id: r.id,
  title: r.title,
  body: r.body,
  record: recordOf(r.recordKind, r.recordId),
  authorId: r.authorId ?? '',
  pinned: r.pinned,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

export const toActivity = (r: Activity) => ({
  id: r.id,
  record: { kind: r.recordKind, id: r.recordId },
  kind: r.kind,
  text: r.text,
  at: r.at.toISOString(),
  actorId: r.actorId ?? undefined,
});
