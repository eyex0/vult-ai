import { readJSON, removeKey, writeJSON } from "./storage";

/** Where the Vult API lives and the token that opens this workspace. Kept in this browser only. */
export interface ApiConnection {
  url: string;
  token: string;
}

const KEY = "api.connection";

export const DEFAULT_API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

export function getConnection(): ApiConnection | null {
  const c = readJSON<ApiConnection | null>(KEY, null);
  return c?.url && c.token ? c : null;
}

export function saveConnection(c: ApiConnection) {
  writeJSON(KEY, { url: c.url.trim().replace(/\/+$/, ""), token: c.token.trim() });
}

export function clearConnection() {
  removeKey(KEY);
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Calls /api/v1 with the workspace token; throws ApiError with the server's message on failure. */
export async function apiFetch<T>(conn: ApiConnection, path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${conn.url}/api/v1${path}`, {
      ...init,
      headers: { authorization: `Bearer ${conn.token}`, ...(init.headers as Record<string, string> | undefined) },
    });
  } catch {
    throw new ApiError(0, `Cannot reach ${conn.url}. Check the address and that the API allows this site (CORS_ORIGINS).`);
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const message = body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : `Request failed (${res.status})`;
    throw new ApiError(res.status, res.status === 401 ? "The token was refused: it may be wrong or expired." : message);
  }
  return body as T;
}

export const postJson = (body: unknown): RequestInit => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
