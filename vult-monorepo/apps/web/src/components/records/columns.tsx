import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { STAGE_TONE } from "@/data/selectors";
import { DEAL_STAGES, INDUSTRIES, SEGMENTS, type Company, type DB, type Deal, type Person, type RecordKind } from "@/data/types";
import { formatDate, formatMoney, formatNumber, timeAgo } from "@/lib/format";

export type EditorKind = "text" | "number" | "select" | "date" | "member" | "company" | "email";

export interface Column<T> {
  key: string;
  label: string;
  width: number;
  align?: "left" | "right";
  /** Value used for sorting. */
  value: (row: T, db: DB) => string | number;
  /** Human-readable value for search, filters and CSV, when it differs from the sort value. */
  text?: (row: T, db: DB) => string;
  render: (row: T, db: DB) => ReactNode;
  edit?: {
    kind: EditorKind;
    options?: readonly string[];
    raw: (row: T) => string | number;
    patch: (value: string) => Partial<T>;
  };
  /** Shown by default in the table. */
  defaultVisible?: boolean;
}

const member = (db: DB, id: string) => db.members.find((m) => m.id === id)?.name ?? "Unassigned";
const company = (db: DB, id: string) => db.companies.find((c) => c.id === id)?.name ?? "—";
const dateOnly = (iso: string) => iso.slice(0, 10);
const toIso = (v: string) => new Date(v + "T12:00:00").toISOString();

function OwnerCell({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[#c9cbd2]">
      <Avatar name={name} size={20} /> {name}
    </span>
  );
}

function CompanyCell({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar name={name} square size={18} /> {name}
    </span>
  );
}

export const COMPANY_COLUMNS: Column<Company>[] = [
  { key: "domain", label: "Domain", width: 190, value: (r) => r.domain, render: (r) => <span className="text-app-dim">{r.domain}</span>, edit: { kind: "text", raw: (r) => r.domain, patch: (v) => ({ domain: v }) }, defaultVisible: true },
  { key: "industry", label: "Industry", width: 150, value: (r) => r.industry, render: (r) => r.industry, edit: { kind: "select", options: INDUSTRIES, raw: (r) => r.industry, patch: (v) => ({ industry: v as Company["industry"] }) }, defaultVisible: true },
  {
    key: "segment", label: "Segment", width: 130, value: (r) => r.segment,
    render: (r) => <Badge dark tone={r.segment === "Enterprise" ? "violet" : r.segment === "Mid-market" ? "blue" : "neutral"}>{r.segment}</Badge>,
    edit: { kind: "select", options: SEGMENTS, raw: (r) => r.segment, patch: (v) => ({ segment: v as Company["segment"] }) }, defaultVisible: true,
  },
  { key: "employees", label: "Employees", width: 120, align: "right", value: (r) => r.employees, render: (r) => <span className="tabular">{formatNumber(r.employees)}</span>, edit: { kind: "number", raw: (r) => r.employees, patch: (v) => ({ employees: Number(v) || 0 }) }, defaultVisible: true },
  { key: "arr", label: "ARR", width: 130, align: "right", value: (r) => r.arr, render: (r) => <span className="tabular">{formatMoney(r.arr)}</span>, edit: { kind: "number", raw: (r) => r.arr, patch: (v) => ({ arr: Number(v) || 0 }) }, defaultVisible: true },
  { key: "location", label: "Location", width: 180, value: (r) => `${r.city}, ${r.country}`, render: (r) => `${r.city}, ${r.country}`, edit: { kind: "text", raw: (r) => r.city, patch: (v) => ({ city: v }) }, defaultVisible: true },
  { key: "owner", label: "Owner", width: 170, value: (r, db) => member(db, r.ownerId), render: (r, db) => <OwnerCell name={member(db, r.ownerId)} />, edit: { kind: "member", raw: (r) => r.ownerId, patch: (v) => ({ ownerId: v }) }, defaultVisible: true },
  { key: "lastInteraction", label: "Last interaction", width: 150, value: (r) => r.lastInteraction, render: (r) => <span className="text-app-dim">{timeAgo(r.lastInteraction)}</span>, defaultVisible: true },
  { key: "createdAt", label: "Created", width: 120, value: (r) => r.createdAt, render: (r) => <span className="text-app-dim">{formatDate(r.createdAt)}</span> },
];

export const PEOPLE_COLUMNS: Column<Person>[] = [
  { key: "email", label: "Email", width: 240, value: (r) => r.email, render: (r) => <span className="text-app-dim">{r.email}</span>, edit: { kind: "email", raw: (r) => r.email, patch: (v) => ({ email: v }) }, defaultVisible: true },
  { key: "title", label: "Job title", width: 180, value: (r) => r.title, render: (r) => r.title, edit: { kind: "text", raw: (r) => r.title, patch: (v) => ({ title: v }) }, defaultVisible: true },
  { key: "company", label: "Company", width: 180, value: (r, db) => company(db, r.companyId), render: (r, db) => <CompanyCell name={company(db, r.companyId)} />, edit: { kind: "company", raw: (r) => r.companyId, patch: (v) => ({ companyId: v }) }, defaultVisible: true },
  {
    key: "strength", label: "Connection", width: 140, value: (r) => ["Weak", "Medium", "Strong", "Very strong"].indexOf(r.strength), text: (r) => r.strength,
    render: (r) => <Badge dark tone={r.strength === "Very strong" ? "green" : r.strength === "Strong" ? "blue" : r.strength === "Medium" ? "amber" : "neutral"}>{r.strength}</Badge>,
    edit: { kind: "select", options: ["Very strong", "Strong", "Medium", "Weak"], raw: (r) => r.strength, patch: (v) => ({ strength: v as Person["strength"] }) }, defaultVisible: true,
  },
  { key: "phone", label: "Phone", width: 150, value: (r) => r.phone, render: (r) => <span className="tabular text-app-dim">{r.phone}</span>, edit: { kind: "text", raw: (r) => r.phone, patch: (v) => ({ phone: v }) }, defaultVisible: true },
  { key: "city", label: "City", width: 140, value: (r) => r.city, render: (r) => r.city, edit: { kind: "text", raw: (r) => r.city, patch: (v) => ({ city: v }) } },
  { key: "owner", label: "Owner", width: 170, value: (r, db) => member(db, r.ownerId), render: (r, db) => <OwnerCell name={member(db, r.ownerId)} />, edit: { kind: "member", raw: (r) => r.ownerId, patch: (v) => ({ ownerId: v }) }, defaultVisible: true },
  { key: "lastInteraction", label: "Last interaction", width: 150, value: (r) => r.lastInteraction, render: (r) => <span className="text-app-dim">{timeAgo(r.lastInteraction)}</span>, defaultVisible: true },
];

export const DEAL_COLUMNS: Column<Deal>[] = [
  { key: "company", label: "Company", width: 180, value: (r, db) => company(db, r.companyId), render: (r, db) => <CompanyCell name={company(db, r.companyId)} />, edit: { kind: "company", raw: (r) => r.companyId, patch: (v) => ({ companyId: v }) }, defaultVisible: true },
  {
    key: "stage", label: "Stage", width: 140, value: (r) => DEAL_STAGES.indexOf(r.stage), text: (r) => r.stage,
    render: (r) => <Badge dark dot tone={STAGE_TONE[r.stage]}>{r.stage}</Badge>,
    edit: { kind: "select", options: DEAL_STAGES, raw: (r) => r.stage, patch: (v) => ({ stage: v as Deal["stage"] }) }, defaultVisible: true,
  },
  { key: "value", label: "Value", width: 130, align: "right", value: (r) => r.value, render: (r) => <span className="tabular">{formatMoney(r.value)}</span>, edit: { kind: "number", raw: (r) => r.value, patch: (v) => ({ value: Number(v) || 0 }) }, defaultVisible: true },
  { key: "owner", label: "Owner", width: 170, value: (r, db) => member(db, r.ownerId), render: (r, db) => <OwnerCell name={member(db, r.ownerId)} />, edit: { kind: "member", raw: (r) => r.ownerId, patch: (v) => ({ ownerId: v }) }, defaultVisible: true },
  { key: "closeDate", label: "Close date", width: 130, value: (r) => r.closeDate, render: (r) => <span className="text-app-dim">{formatDate(r.closeDate)}</span>, edit: { kind: "date", raw: (r) => dateOnly(r.closeDate), patch: (v) => ({ closeDate: toIso(v) }) }, defaultVisible: true },
  { key: "source", label: "Source", width: 120, value: (r) => r.source, render: (r) => r.source, edit: { kind: "select", options: ["Inbound", "Outbound", "Referral", "Partner", "Event"], raw: (r) => r.source, patch: (v) => ({ source: v as Deal["source"] }) }, defaultVisible: true },
  { key: "nextStep", label: "Next step", width: 220, value: (r) => r.nextStep, render: (r) => <span className="text-app-dim">{r.nextStep}</span>, edit: { kind: "text", raw: (r) => r.nextStep, patch: (v) => ({ nextStep: v }) }, defaultVisible: true },
  { key: "createdAt", label: "Created", width: 120, value: (r) => r.createdAt, render: (r) => <span className="text-app-dim">{formatDate(r.createdAt)}</span> },
];

export const KIND_CONFIG = {
  companies: { columns: COMPANY_COLUMNS, nameLabel: "Company" },
  people: { columns: PEOPLE_COLUMNS, nameLabel: "Person" },
  deals: { columns: DEAL_COLUMNS, nameLabel: "Deal" },
} satisfies Record<RecordKind, { columns: Column<never>[] | Column<Company>[] | Column<Person>[] | Column<Deal>[]; nameLabel: string }>;

export type AnyRecord = Company | Person | Deal;

export function columnsFor(kind: RecordKind): Column<AnyRecord>[] {
  return KIND_CONFIG[kind].columns as unknown as Column<AnyRecord>[];
}

export function rowsFor(db: DB, kind: RecordKind): AnyRecord[] {
  return db[kind] as AnyRecord[];
}

export function cellText<T>(c: Column<T>, row: T, db: DB): string {
  return c.text ? c.text(row, db) : String(c.value(row, db));
}

export function recordSubtitle(db: DB, kind: RecordKind, r: AnyRecord): string {
  if (kind === "companies") return (r as Company).domain;
  if (kind === "people") return `${(r as Person).title} · ${company(db, (r as Person).companyId)}`;
  return `${company(db, (r as Deal).companyId)} · ${formatMoney((r as Deal).value)}`;
}
