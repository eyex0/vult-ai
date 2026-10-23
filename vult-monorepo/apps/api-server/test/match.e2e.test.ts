import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Runs only against a disposable database: VULT_E2E=1 with DATABASE_URL (app role, RLS enforced) and JWT_SECRET.
const enabled = process.env.VULT_E2E === '1';
const invoiceXml = readFileSync(new URL('../../../packages/fatturapa/test/fixtures/riba-two-installments.xml', import.meta.url));

describe.skipIf(!enabled)('Vult Match API', () => {
  let base = '';
  let close = () => {};
  let token = '';
  let otherToken = '';
  const tenantId = crypto.randomUUID();

  beforeAll(async () => {
    const { prisma } = await import('@vult/database');
    const { app } = await import('../src/app.js');
    // Tenants table is under RLS too: create the row inside the tenant's own context.
    for (const id of [tenantId]) {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${id}, true)`;
        await tx.tenant.create({ data: { id, name: 'Distribuzioni Demo', vatNumber: '00000000909' } });
      });
    }
    const sign = (t: string) => jwt.sign({ sub: crypto.randomUUID(), tenantId: t, role: 'ADMIN' }, process.env.JWT_SECRET!, { algorithm: 'HS256' });
    token = sign(tenantId);
    otherToken = sign(crypto.randomUUID());
    const server = app.listen(0);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
    close = () => server.close();
  });
  afterAll(() => close());

  const call = (path: string, init: RequestInit = {}, auth = token) =>
    fetch(`${base}${path}`, { ...init, headers: { authorization: `Bearer ${auth}`, ...(init.headers ?? {}) } }).then(async (r) => ({ status: r.status, body: await r.json() }));
  const json = (body: unknown) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

  it('imports invoices once', async () => {
    const first = await call('/invoices/import', { method: 'POST', headers: { 'content-type': 'application/xml' }, body: invoiceXml });
    expect(first).toMatchObject({ status: 201, body: { created: 1, existing: 0 } });
    const again = await call('/invoices/import', { method: 'POST', headers: { 'content-type': 'application/xml' }, body: invoiceXml });
    expect(again.body).toMatchObject({ created: 0, existing: 1 });
  });

  it('imports a statement, matches, learns from a confirmation and auto-matches the next payment', async () => {
    const csv = [
      'Data contabile;Descrizione;Entrate;Uscite;IBAN controparte',
      '31/03/2025;BONIFICO DA PASTIFICIO AURORA SRL PER RATA;"1.220,00";;IT00X0000000000000000000001',
      '30/04/2025;BONIFICO DA PASTIFICIO AURORA SRL PER RATA;"1.220,00";;IT00X0000000000000000000001',
      '02/04/2025;ADDEBITO SDD ENEL;;"120,40";',
    ].join('\n');
    const imported = await call('/bank/statements', { method: 'POST', headers: { 'content-type': 'text/csv' }, body: csv });
    expect(imported.body).toMatchObject({ imported: 3, duplicates: 0 });
    expect((await call('/bank/statements', { method: 'POST', headers: { 'content-type': 'text/csv' }, body: csv })).body).toMatchObject({ imported: 0, duplicates: 3 });

    const run = await call('/match/run', json({ today: '2025-05-01' }));
    expect(run.body).toMatchObject({ ignored: 1 });
    expect(run.body.auto).toBe(0);

    const list = await call('/match/transactions?status=SUGGESTED');
    const march = list.body.transactions.find((t: { date: string }) => t.date === '2025-03-31');
    expect(march.suggestion.best.allocations).toHaveLength(1);

    const confirmed = await call(`/match/transactions/${march.id}/confirm`, json({ allocations: march.suggestion.best.allocations.map((a: { itemId: string; amount: number }) => ({ installmentId: a.itemId, amountCents: a.amount })), today: '2025-05-01' }));
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.lessons[0]).toMatch(/IBAN ending 0001/);
    expect(confirmed.body.rerun.auto).toBe(1);

    const again = await call(`/match/transactions/${march.id}/confirm`, json({ allocations: [{ installmentId: march.suggestion.best.allocations[0].itemId, amountCents: 1 }] }));
    expect(again.status).toBe(409);

    const balances = await call('/receivables?today=2025-05-01');
    expect(balances.body.data[0]).toMatchObject({ customerVat: '00000000101', billed: 244_000, collected: 244_000, open: 0 });
  });

  it('keeps tenants apart', async () => {
    const other = await call('/match/transactions', {}, otherToken);
    expect(other.body.transactions).toEqual([]);
    expect((await call('/receivables', {}, otherToken)).body.data).toEqual([]);
  });

  it('rejects allocations that do not fit', async () => {
    const list = await call('/match/transactions?status=IGNORED');
    const enel = list.body.transactions[0];
    const bad = await call(`/match/transactions/${enel.id}/confirm`, json({ allocations: [{ installmentId: crypto.randomUUID(), amountCents: -100 }] }));
    expect(bad.status).toBe(400);
  });
});
