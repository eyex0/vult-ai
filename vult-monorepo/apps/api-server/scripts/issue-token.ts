/**
 * Issues an API token for a workspace, creating the workspace if asked. Until sign-in is connected to the API,
 * this is how a design partner's browser gets access: paste the printed token in the Match page.
 *
 *   pnpm --filter @vult/api-server token -- --create --name "Distribuzioni Demo" --vat 00000000909
 *   pnpm --filter @vult/api-server token -- --tenant <uuid> --role MANAGER --days 30
 */
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import jwt from 'jsonwebtoken';
import { prisma } from '@vult/database';

const { values } = parseArgs({
  // pnpm passes a literal "--" through; drop it.
  args: process.argv.slice(2).filter((a) => a !== '--'),
  options: {
    tenant: { type: 'string' },
    create: { type: 'boolean', default: false },
    name: { type: 'string' },
    vat: { type: 'string' },
    role: { type: 'string', default: 'ADMIN' },
    days: { type: 'string', default: '30' },
  },
});

async function main() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be set (32+ characters), the same value the API uses');
  if (!['ADMIN', 'MANAGER', 'MEMBER', 'READ_ONLY'].includes(values.role!)) throw new Error('--role must be ADMIN, MANAGER, MEMBER or READ_ONLY');
  let tenantId = values.tenant;
  if (values.create) {
    if (!values.name) throw new Error('--create needs --name');
    tenantId = randomUUID();
    const id = tenantId;
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${id}, true)`;
      await tx.tenant.create({ data: { id, name: values.name!, vatNumber: values.vat ?? null } });
    });
    console.error(`Created workspace ${values.name} (${tenantId})`);
  }
  if (!tenantId) throw new Error('Pass --tenant <uuid> or --create --name <name>');
  const days = Number(values.days);
  const token = jwt.sign({ sub: randomUUID(), tenantId, role: values.role }, secret, { algorithm: 'HS256', expiresIn: `${Number.isFinite(days) ? days : 30}d` });
  console.log(token);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
