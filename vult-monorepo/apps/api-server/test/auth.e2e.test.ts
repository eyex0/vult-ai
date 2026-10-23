import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Runs only against a disposable database: VULT_E2E=1 with DATABASE_URL (app role, RLS enforced) and JWT_SECRET.
const enabled = process.env.VULT_E2E === '1';

describe.skipIf(!enabled)('auth', () => {
  let base = '';
  let close = () => {};
  const email = `owner-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const password = 'correct horse battery';

  beforeAll(async () => {
    const { app } = await import('../src/app.js');
    const server = app.listen(0);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
    close = () => server.close();
  });
  afterAll(() => close());

  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const cookieOf = (res: Response) => (res.headers.get('set-cookie') ?? '').split(';')[0]!;

  it('signs up: creates the workspace, the admin and a session cookie', async () => {
    const res = await post('/auth/signup', { name: 'Giulia Demo', email: email.toUpperCase(), password, workspace: 'Distribuzioni Demo', vatNumber: 'IT00000000909' });
    expect(res.status).toBe(201);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/vult_session=.+HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    const body = await res.json();
    expect(body).toMatchObject({ user: { email, role: 'ADMIN' }, workspace: { name: 'Distribuzioni Demo' } });

    const me = await fetch(`${base}/auth/me`, { headers: { cookie: cookieOf(res) } });
    expect((await me.json()).user.email).toBe(email);
    const objects = await (await fetch(`${base}/objects`, { headers: { cookie: cookieOf(res) } })).json();
    expect(objects.data.map((o: { slug: string }) => o.slug).sort()).toEqual(['companies', 'deals', 'people']);
  });

  it('refuses a second account with the same email', async () => {
    const res = await post('/auth/signup', { name: 'Other', email, password, workspace: 'Other' });
    expect(res.status).toBe(409);
  });

  it('rejects weak passwords and bad VAT numbers', async () => {
    const res = await post('/auth/signup', { name: 'X', email: 'x@example.com', password: 'short', workspace: 'X', vatNumber: '123' });
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).fields).sort()).toEqual(['password', 'vatNumber']);
  });

  it('logs in with the right password only, with the same answer for unknown emails', async () => {
    const wrong = await post('/auth/login', { email, password: 'wrong password' });
    const unknown = await post('/auth/login', { email: 'nobody@example.com', password });
    expect([wrong.status, unknown.status]).toEqual([401, 401]);
    expect((await wrong.json()).error).toBe((await unknown.json()).error);
    const ok = await post('/auth/login', { email, password });
    expect(ok.status).toBe(200);
    expect(cookieOf(ok)).toMatch(/^vult_session=/);
  });

  it('requires the CSRF header for cookie-authenticated writes', async () => {
    const cookie = cookieOf(await post('/auth/login', { email, password }));
    const without = await post('/match/run', {}, { cookie });
    expect(without.status).toBe(403);
    const withHeader = await post('/match/run', {}, { cookie, 'x-vult-csrf': '1' });
    expect(withHeader.status).toBe(200);
  });

  it('logs out by clearing the cookie', async () => {
    const res = await fetch(`${base}/auth/logout`, { method: 'POST' });
    expect(res.status).toBe(204);
    expect(res.headers.get('set-cookie')).toMatch(/vult_session=;.*Expires=Thu, 01 Jan 1970/i);
  });
});
