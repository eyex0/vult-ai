import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { readJSON, writeJSON } from "@/lib/storage";
import { createSeed, DB_VERSION, refreshMeetings } from "./seed";
import type { Activity, ChecklistKey, DB, RecordRef, Workspace } from "./types";

type ArrayKey = { [K in keyof DB]: DB[K] extends unknown[] ? K : never }[keyof DB];
type ItemOf<K extends ArrayKey> = DB[K] extends (infer T)[] ? T : never;

const STORAGE_KEY = "db";

function load(): DB {
  const saved = readJSON<DB | null>(STORAGE_KEY, null);
  if (saved && saved.version === DB_VERSION) return refreshMeetings(saved);
  return createSeed();
}

let db: DB = load();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function commit(next: DB) {
  db = next;
  listeners.forEach((l) => l());
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeJSON(STORAGE_KEY, db), 150);
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
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

export const store = {
  create<K extends ArrayKey>(key: K, item: ItemOf<K>) {
    commit({ ...db, [key]: [item, ...(db[key] as ItemOf<K>[])] });
    return item;
  },

  update<K extends ArrayKey>(key: K, id: string, patch: Partial<ItemOf<K>>) {
    commit({
      ...db,
      [key]: list(key).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });
  },

  /** Removes items and shows a toast with Undo. */
  remove<K extends ArrayKey>(key: K, ids: string[], label = "item") {
    const before = list(key);
    const removed = before.filter((x) => ids.includes(x.id));
    if (!removed.length) return;
    commit({ ...db, [key]: before.filter((x) => !ids.includes(x.id)) });
    toast(`${removed.length === 1 ? "Deleted 1 " + label : `Deleted ${removed.length} ${label}s`}`, {
      action: {
        label: "Undo",
        onClick: () => {
          const current = list(key);
          commit({ ...db, [key]: [...removed, ...current.filter((x) => !ids.includes(x.id))] });
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
    const entry: Activity = { id: uid("a"), record, kind, text, at: new Date().toISOString(), actorId: "m1" };
    commit({ ...db, activities: [entry, ...db.activities] });
  },

  reset() {
    commit(createSeed());
    toast.success("Demo data reset");
  },
};
