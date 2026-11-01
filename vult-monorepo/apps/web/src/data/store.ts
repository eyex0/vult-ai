import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { API_MODE, apiFetch, postJson, sessionConnection } from "@/lib/api";
import { readJSON, writeJSON } from "@/lib/storage";
import { getLocale, tr } from "@/lib/i18n";
import { createSeed, DB_VERSION, refreshMeetings } from "./seed";
import { createArabicSeed } from "./seedArabic";
import type { Activity, ChecklistKey, DB, Member, RecordRef, Workspace } from "./types";

type ArrayKey = { [K in keyof DB]-?: DB[K] extends unknown[] ? K : never }[keyof DB];
type ItemOf<K extends ArrayKey> = DB[K] extends (infer T)[] ? T : never;

const STORAGE_KEY = "db";

/**
 * Two modes. Demo (no VITE_API_URL): the whole workspace is sample data kept in this browser.
 * API: CRM records (companies, people, deals, tasks, notes, activities) live on the server. They are loaded
 * into this store, changes show at once and are saved in the background, and a refused save is rolled back.
 */
const SERVER_KEYS = new Set<ArrayKey>(["companies", "people", "deals", "tasks", "notes"]);
const synced = (key: ArrayKey) => API_MODE && SERVER_KEYS.has(key);

function emptyDB(): DB {
  const seed = createSeed();
  const none = { members: [], companies: [], people: [], deals: [], tasks: [], notes: [], emails: [], templates: [], activities: [], meetings: [], calls: [], inbox: [], workflows: [], sequences: [], dashboards: [], lists: [], chats: [] };
  return { ...seed, ...none, workspace: { ...seed.workspace, name: "", domain: "", currency: "SAR", country: "SA" } };
}

function load(): DB {
  if (API_MODE) return emptyDB();
  const saved = readJSON<DB | null>(STORAGE_KEY, null);
  if (saved && saved.version === DB_VERSION) return refreshMeetings(saved);
  return seedFor();
}

/** Demo data matching the interface language: an Arab-market workspace in Arabic. */
function seedFor(): DB {
  return getLocale() === "ar" ? createArabicSeed() : createSeed();
}

let db: DB = load();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function commit(next: DB) {
  db = next;
  listeners.forEach((l) => l());
  // Server-backed workspaces keep their records on the server, never in this browser.
  if (API_MODE) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeJSON(STORAGE_KEY, db), 150);
}

/** New record ids: UUIDs when the server stores them, short readable ids in the demo. */
export function uid(prefix = "id") {
  if (API_MODE) return crypto.randomUUID();
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** The signed-in member: the session's user on the server, the demo's first member otherwise. */
export function me(): string {
  return db.meId ?? "m1";
}

/** Subscribe to the whole database. Derive what you need with useMemo. */
export function useDB(): DB {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => db,
    () => db,
  );
}

export function getDB() {
  return db;
}

type WithId<K extends ArrayKey> = ItemOf<K> & { id: string };
const list = <K extends ArrayKey>(key: K) => db[key] as unknown as WithId<K>[];

/** Saves in the background; when the server refuses, puts the local copy back and says why. */
function save<T>(request: Promise<T>, rollback: () => void, then?: (result: T) => void) {
  request.then(then, (error: unknown) => {
    rollback();
    toast.error(tr("Not saved"), { description: error instanceof Error ? error.message : undefined });
  });
}

const json = (method: string, body: unknown): RequestInit => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export const store = {
  create<K extends ArrayKey>(key: K, item: ItemOf<K>) {
    commit({ ...db, [key]: [item, ...(db[key] as ItemOf<K>[])] });
    if (synced(key)) {
      const id = (item as { id: string }).id;
      save(
        apiFetch<{ data: Partial<WithId<K>> }>(sessionConnection, `/crm/${key}`, postJson(item)),
        () => commit({ ...db, [key]: list(key).filter((x) => x.id !== id) }),
        // The server's copy wins for fields it normalises (phone numbers, owners).
        (res) => commit({ ...db, [key]: list(key).map((x) => (x.id === id ? Object.assign({}, x, res.data) : x)) }),
      );
    }
    return item;
  },

  update<K extends ArrayKey>(key: K, id: string, patch: Partial<ItemOf<K>>) {
    const before = list(key).find((x) => x.id === id);
    commit({
      ...db,
      [key]: list(key).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });
    if (synced(key) && before) {
      save(
        apiFetch(sessionConnection, `/crm/${key}/${id}`, json("PATCH", patch)),
        () => commit({ ...db, [key]: list(key).map((x) => (x.id === id ? before : x)) }),
      );
    }
  },

  /** Removes items and shows a toast with Undo. On the server the rows are soft-deleted, so Undo restores them. */
  remove<K extends ArrayKey>(key: K, ids: string[], label = "item") {
    const before = list(key);
    const removed = before.filter((x) => ids.includes(x.id));
    if (!removed.length) return;
    const putBack = () => {
      const current = list(key);
      commit({ ...db, [key]: [...removed, ...current.filter((x) => !ids.includes(x.id))] });
    };
    commit({ ...db, [key]: before.filter((x) => !ids.includes(x.id)) });
    if (synced(key)) save(apiFetch(sessionConnection, `/crm/${key}/delete`, postJson({ ids })), putBack);
    toast(`${removed.length === 1 ? "Deleted 1 " + label : `Deleted ${removed.length} ${label}s`}`, {
      action: {
        label: "Undo",
        onClick: () => {
          putBack();
          if (synced(key)) save(apiFetch(sessionConnection, `/crm/${key}/restore`, postJson({ ids })), () => commit({ ...db, [key]: list(key).filter((x) => !ids.includes(x.id)) }));
        },
      },
    });
  },

  setWorkspace(patch: Partial<Workspace>) {
    commit({ ...db, workspace: { ...db.workspace, ...patch } });
  },

  tick(key: ChecklistKey) {
    if (db.workspace.checklist[key]) return;
    commit({ ...db, workspace: { ...db.workspace, checklist: { ...db.workspace.checklist, [key]: true } } });
  },

  log(record: RecordRef, kind: Activity["kind"], text: string) {
    const entry: Activity = { id: uid("a"), record, kind, text, at: new Date().toISOString(), actorId: me() };
    commit({ ...db, activities: [entry, ...db.activities] });
    // The server records creations and stage changes itself (agents change records too); send the rest.
    if (API_MODE && kind !== "created" && kind !== "stage") {
      save(apiFetch(sessionConnection, "/crm/activities", postJson({ record, kind, text })), () => commit({ ...db, activities: db.activities.filter((a) => a.id !== entry.id) }));
    }
  },

  reset() {
    commit(seedFor());
    toast.success(getLocale() === "ar" ? "تمت إعادة ضبط البيانات التجريبية" : "Demo data reset");
  },
};

type Status = "idle" | "loading" | "ready" | "error";
let status: Status = API_MODE ? "idle" : "ready";
const statusListeners = new Set<() => void>();
const setStatus = (next: Status) => {
  status = next;
  statusListeners.forEach((l) => l());
};

/** Whether the server's records have been loaded (always "ready" in the demo). */
export function useCrmStatus(): Status {
  return useSyncExternalStore(
    (cb) => {
      statusListeners.add(cb);
      return () => statusListeners.delete(cb);
    },
    () => status,
    () => status,
  );
}

/** Records loaded into the browser per object; beyond this the lists will page from the server. */
const LOAD_CAP = 5000;

async function fetchAll<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  let cursor: string | null = null;
  do {
    const sep = path.includes("?") ? "&" : "?";
    const page: { data: T[]; nextCursor: string | null } = await apiFetch(sessionConnection, `${path}${sep}limit=500${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    rows.push(...page.data);
    cursor = page.nextCursor;
  } while (cursor && rows.length < LOAD_CAP);
  return rows;
}

/** Loads the signed-in workspace's CRM from the server, once per page load. */
export async function loadWorkspace(workspaceName: string) {
  if (!API_MODE || status === "loading" || status === "ready") return;
  setStatus("loading");
  try {
    const [members, companies, people, deals, tasks, notes, activities] = await Promise.all([
      apiFetch<{ me: string; data: Member[] }>(sessionConnection, "/crm/members"),
      fetchAll<DB["companies"][number]>("/crm/companies"),
      fetchAll<DB["people"][number]>("/crm/people"),
      fetchAll<DB["deals"][number]>("/crm/deals"),
      fetchAll<DB["tasks"][number]>("/crm/tasks"),
      fetchAll<DB["notes"][number]>("/crm/notes"),
      apiFetch<{ data: Activity[] }>(sessionConnection, "/crm/activities?limit=500"),
    ]);
    commit({
      ...db,
      meId: members.me,
      members: members.data,
      companies,
      people,
      deals,
      tasks,
      notes,
      activities: activities.data,
      workspace: { ...db.workspace, name: workspaceName },
    });
    setStatus("ready");
  } catch (error) {
    setStatus("error");
    toast.error(tr("Could not load your workspace"), { description: error instanceof Error ? error.message : undefined });
  }
}
