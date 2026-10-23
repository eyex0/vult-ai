import { useSyncExternalStore } from "react";
import { API_MODE, apiFetch, postJson, sessionConnection } from "./api";
import { readJSON, removeKey, writeJSON } from "./storage";

export interface Session {
  name: string;
  email: string;
  workspace: string;
  createdAt: string;
  role?: string;
}

/**
 * Two modes. Demo (no VITE_API_URL): any email signs in and the session lives in this browser.
 * API: the server keeps the session in an httpOnly cookie; this module only mirrors /auth/me.
 */
const KEY = "session";
const listeners = new Set<() => void>();
let current: Session | null = API_MODE ? null : readJSON<Session | null>(KEY, null);
let loading = API_MODE;

function emit() {
  listeners.forEach((l) => l());
}

function set(next: Session | null) {
  current = next;
  if (!API_MODE) {
    if (next) writeJSON(KEY, next);
    else removeKey(KEY);
  }
  emit();
}

interface ApiAuth {
  user: { name: string; email: string; role: string };
  workspace: { name: string };
}

const fromApi = (a: ApiAuth): Session => ({ name: a.user.name, email: a.user.email, role: a.user.role, workspace: a.workspace.name, createdAt: new Date().toISOString() });

/** Demo sign-in: any email works. */
export function signIn(email: string, name?: string): Session {
  const local = email.split("@")[0] ?? "there";
  const pretty = name?.trim() || local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const session = { name: pretty, email, workspace: current?.workspace ?? "Ridgeway Labs", createdAt: new Date().toISOString() };
  set(session);
  return session;
}

export async function signInWithPassword(email: string, password: string): Promise<Session> {
  const session = fromApi(await apiFetch<ApiAuth>(sessionConnection, "/auth/login", postJson({ email, password })));
  set(session);
  return session;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  workspace: string;
  vatNumber?: string;
}

export async function signUpWithPassword(input: SignUpInput): Promise<Session> {
  const session = fromApi(await apiFetch<ApiAuth>(sessionConnection, "/auth/signup", postJson(input)));
  set(session);
  return session;
}

/** Renames the signed-in user (on the server in API mode). */
export async function updateProfileName(name: string) {
  if (!current) return;
  if (API_MODE) await apiFetch(sessionConnection, "/auth/me", postJson({ name }));
  set({ ...current, name });
}

export async function signOut() {
  if (API_MODE) {
    try {
      await apiFetch(sessionConnection, "/auth/logout", { method: "POST" });
    } catch {
      /* the cookie expires on its own; still sign out locally */
    }
  }
  set(null);
}

/** Asks the API who is signed in. Called once at startup in API mode. */
export async function loadSession() {
  if (!API_MODE) return;
  try {
    current = fromApi(await apiFetch<ApiAuth>(sessionConnection, "/auth/me"));
  } catch {
    current = null;
  }
  loading = false;
  emit();
}

export function getSession() {
  return current;
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}

/** True until the API has said whether someone is signed in. */
export function useSessionLoading(): boolean {
  return useSyncExternalStore(subscribe, () => loading, () => false);
}
