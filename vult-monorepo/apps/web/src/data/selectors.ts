import type { BadgeTone } from "@/components/ui/Badge";
import type { Company, DB, Deal, DealStage, Person, RecordKind, RecordRef } from "./types";

export const STAGE_TONE: Record<DealStage, BadgeTone> = {
  Lead: "neutral",
  Qualified: "blue",
  Proposal: "violet",
  Negotiation: "amber",
  Won: "green",
  Lost: "red",
};

export const OPEN_STAGES: DealStage[] = ["Lead", "Qualified", "Proposal", "Negotiation"];

export const OBJECT_META: Record<RecordKind, { singular: string; plural: string; color: string; href: string }> = {
  companies: { singular: "Company", plural: "Companies", color: "#3b5bfd", href: "/app/companies" },
  people: { singular: "Person", plural: "People", color: "#16a34a", href: "/app/people" },
  deals: { singular: "Deal", plural: "Deals", color: "#f2994a", href: "/app/deals" },
};

export function byId<T extends { id: string }>(items: T[]) {
  const map = new Map<string, T>();
  for (const i of items) map.set(i.id, i);
  return map;
}

export function memberName(db: DB, id: string | undefined) {
  return db.members.find((m) => m.id === id)?.name ?? "Unassigned";
}

export function recordLabel(db: DB, ref: RecordRef | undefined): string {
  if (!ref) return "";
  if (ref.kind === "companies") return db.companies.find((c) => c.id === ref.id)?.name ?? "Deleted company";
  if (ref.kind === "people") return db.people.find((p) => p.id === ref.id)?.name ?? "Deleted person";
  return db.deals.find((d) => d.id === ref.id)?.name ?? "Deleted deal";
}

export function recordHref(ref: RecordRef) {
  return `${OBJECT_META[ref.kind].href}/${ref.id}`;
}

export function companyOf(db: DB, item: Deal | Person): Company | undefined {
  return db.companies.find((c) => c.id === item.companyId);
}

export function peopleAt(db: DB, companyId: string): Person[] {
  return db.people.filter((p) => p.companyId === companyId);
}

export interface SearchHit {
  group: "Companies" | "People" | "Deals" | "Tasks" | "Notes";
  id: string;
  label: string;
  meta: string;
  href: string;
}

/** Search used by the ⌘K palette. Empty query returns a few recent items per group. */
export function search(db: DB, query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  const match = (...fields: (string | undefined)[]) => !q || fields.some((f) => f?.toLowerCase().includes(q));
  const cap = q ? 6 : 3;
  const companies = db.companies
    .filter((c) => match(c.name, c.domain, c.industry))
    .slice(0, cap)
    .map<SearchHit>((c) => ({ group: "Companies", id: c.id, label: c.name, meta: c.domain, href: `/app/companies/${c.id}` }));
  const people = db.people
    .filter((p) => match(p.name, p.email, p.title))
    .slice(0, cap)
    .map<SearchHit>((p) => ({ group: "People", id: p.id, label: p.name, meta: p.title, href: `/app/people/${p.id}` }));
  const deals = db.deals
    .filter((d) => match(d.name, companyOf(db, d)?.name))
    .slice(0, cap)
    .map<SearchHit>((d) => ({ group: "Deals", id: d.id, label: d.name, meta: companyOf(db, d)?.name ?? "", href: `/app/deals/${d.id}` }));
  const tasks = db.tasks
    .filter((t) => match(t.title))
    .slice(0, cap)
    .map<SearchHit>((t) => ({ group: "Tasks", id: t.id, label: t.title, meta: t.done ? "Done" : "Open", href: `/app/tasks?task=${t.id}` }));
  const notes = db.notes
    .filter((n) => match(n.title, n.body))
    .slice(0, cap)
    .map<SearchHit>((n) => ({ group: "Notes", id: n.id, label: n.title, meta: "Note", href: `/app/notes/${n.id}` }));
  return [...companies, ...people, ...deals, ...tasks, ...notes];
}

export function pipelineTotals(db: DB) {
  const open = db.deals.filter((d) => OPEN_STAGES.includes(d.stage));
  const won = db.deals.filter((d) => d.stage === "Won");
  const lost = db.deals.filter((d) => d.stage === "Lost");
  const sum = (ds: Deal[]) => ds.reduce((a, d) => a + d.value, 0);
  return {
    openValue: sum(open),
    openCount: open.length,
    wonValue: sum(won),
    wonCount: won.length,
    winRate: won.length + lost.length ? won.length / (won.length + lost.length) : 0,
  };
}

export const STATUS_TONE = { Live: "green", Active: "green", Paused: "neutral", Draft: "amber" } as const;
