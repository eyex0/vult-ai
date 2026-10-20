import { beforeEach, describe, expect, it, vi } from "vitest";

const toastCalls: { message: string; action?: { label: string; onClick: () => void } }[] = [];
vi.mock("sonner", () => {
  const toast = (message: string, opts?: { action?: { label: string; onClick: () => void } }) => toastCalls.push({ message, action: opts?.action });
  toast.success = (message: string) => toastCalls.push({ message });
  return { toast };
});

import { createSeed, refreshMeetings } from "@/data/seed";
import { pipelineTotals, search } from "@/data/selectors";
import { getDB, store } from "@/data/store";
import { readJSON, writeJSON } from "@/lib/storage";
import { applyFilter } from "@/components/records/Toolbar";

describe("seed", () => {
  const db = createSeed(Date.UTC(2026, 9, 19, 9));

  it("creates the documented amount of fictional demo data", () => {
    expect(db.companies).toHaveLength(30);
    expect(db.people).toHaveLength(60);
    expect(db.deals).toHaveLength(25);
  });

  it("is deterministic", () => {
    expect(createSeed(Date.UTC(2026, 9, 19, 9))).toEqual(db);
  });

  it("uses unique ids and unique person names", () => {
    for (const key of ["companies", "people", "deals", "tasks", "notes"] as const) {
      const ids = db[key].map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    const names = db.people.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("only references records that exist", () => {
    const companyIds = new Set(db.companies.map((c) => c.id));
    const memberIds = new Set(db.members.map((m) => m.id));
    db.people.forEach((p) => expect(companyIds.has(p.companyId)).toBe(true));
    db.deals.forEach((d) => {
      expect(companyIds.has(d.companyId)).toBe(true);
      expect(memberIds.has(d.ownerId)).toBe(true);
    });
  });

  it("refreshes meetings for a new day but keeps them on the same day", () => {
    const sameDay = refreshMeetings(db, Date.UTC(2026, 9, 19, 15));
    expect(sameDay).toBe(db);
    const nextWeek = refreshMeetings(db, Date.UTC(2026, 9, 26, 9));
    expect(nextWeek.meetings[0]!.start.slice(0, 10)).not.toBe(db.meetings[0]!.start.slice(0, 10));
  });
});

describe("storage", () => {
  it("falls back when localStorage is unavailable", () => {
    expect(readJSON("missing", 42)).toBe(42);
    expect(() => writeJSON("x", { a: 1 })).not.toThrow();
  });

  it("round-trips JSON and survives a throwing storage", () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("window", { localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v), removeItem: (k: string) => mem.delete(k) } });
    writeJSON("k", { a: 1 });
    expect(readJSON("k", null)).toEqual({ a: 1 });
    vi.stubGlobal("window", { localStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); } } });
    expect(readJSON("k", "fallback")).toBe("fallback");
    expect(() => writeJSON("k", 1)).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe("store", () => {
  beforeEach(() => {
    store.reset();
    toastCalls.length = 0;
  });

  it("updates a record immutably", () => {
    const before = getDB();
    store.update("deals", "d1", { value: 1234 });
    expect(getDB().deals.find((d) => d.id === "d1")!.value).toBe(1234);
    expect(before.deals.find((d) => d.id === "d1")!.value).not.toBe(1234);
  });

  it("deletes with an undo action that restores the records", () => {
    store.remove("deals", ["d1", "d2"], "deal");
    expect(getDB().deals.some((d) => d.id === "d1")).toBe(false);
    const t = toastCalls.at(-1)!;
    expect(t.message).toBe("Deleted 2 deals");
    t.action!.onClick();
    expect(getDB().deals.filter((d) => d.id === "d1" || d.id === "d2")).toHaveLength(2);
  });

  it("ticks checklist items once", () => {
    store.tick("deal");
    store.tick("deal");
    expect(getDB().workspace.checklist.deal).toBe(true);
  });
});

describe("selectors", () => {
  it("searches across companies, people, deals, tasks and notes", () => {
    const db = createSeed();
    const hits = search(db, "kelvra");
    expect(hits.some((h) => h.group === "Companies" && h.label === "Kelvra")).toBe(true);
    expect(hits.some((h) => h.group === "Notes")).toBe(true);
    expect(search(db, "zzzz-no-match")).toHaveLength(0);
  });

  it("computes pipeline totals", () => {
    const db = createSeed();
    const t = pipelineTotals(db);
    expect(t.openCount + t.wonCount + db.deals.filter((d) => d.stage === "Lost").length).toBe(25);
    expect(t.winRate).toBeGreaterThan(0);
    expect(t.winRate).toBeLessThanOrEqual(1);
  });
});

describe("filters", () => {
  it("matches text and numbers", () => {
    expect(applyFilter("Negotiation", { id: "1", key: "stage", op: "contains", value: "nego" })).toBe(true);
    expect(applyFilter("Lead", { id: "1", key: "stage", op: "is", value: "lead" })).toBe(true);
    expect(applyFilter(5000, { id: "1", key: "value", op: "gt", value: "1000" })).toBe(true);
    expect(applyFilter(500, { id: "1", key: "value", op: "gt", value: "1000" })).toBe(false);
  });
});
