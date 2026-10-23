import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const enabled = process.env.VULT_E2E === '1';

describe.skipIf(!enabled)('early access requests', () => {
  let base = '';
  let close = () => {};
  beforeAll(async () => {
    const { app } = await import('../src/app.js');
    const server = app.listen(0);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
    close = () => server.close();
  });
  afterAll(() => close());

  const post = (body: unknown) => fetch(`${base}/leads`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const valid = { name: 'Giulia Demo', email: 'Giulia@Example.com', company: 'Distribuzioni Demo', role: 'Owner or CEO', invoicesPerMonth: '50-200', language: 'it' };

  it('stores a request without being signed in', async () => {
    const res = await post(valid);
    expect(res.status).toBe(201);
    const { prisma } = await import('@vult/database');
    const lead = await prisma.lead.findFirst({ where: { email: 'giulia@example.com' }, orderBy: { createdAt: 'desc' } });
    expect(lead).toMatchObject({ company: 'Distribuzioni Demo', language: 'it', invoicesPerMonth: '50-200' });
  });

  it('rejects bad input and filled honeypots', async () => {
    expect((await post({ ...valid, email: 'not-an-email' })).status).toBe(400);
    expect((await post({ ...valid, invoicesPerMonth: 'lots' })).status).toBe(400);
    expect((await post({ ...valid, website: 'http://spam.example' })).status).toBe(400);
  });
});
