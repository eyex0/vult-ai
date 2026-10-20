import { useSyncExternalStore } from "react";
import { readJSON, removeKey, writeJSON } from "./storage";

export interface Session {
  name: string;
  email: string;
  workspace: string;
  createdAt: string;
}

const KEY = "session";
const listeners = new Set<() => void>();
let current: Session | null = readJSON<Session | null>(KEY, null);

function emit() {
  listeners.forEach((l) => l());
}

export function signIn(email: string, name?: string): Session {
  const local = email.split("@")[0] ?? "there";
  const pretty = name?.trim() || local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  current = { name: pretty, email, workspace: "Ridgeway Labs", createdAt: new Date().toISOString() };
  writeJSON(KEY, current);
  emit();
  return current;
}

export function signOut() {
  current = null;
  removeKey(KEY);
  emit();
}

export function getSession() {
  return current;
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => null,
  );
}
