import { prisma } from '../src/index.js';

const tables = [
  ['tenants', 'id'],
  ['users', 'tenant_id'],
  ['object_types', 'tenant_id'],
  ['attributes', 'tenant_id'],
  ['records', 'tenant_id'],
  ['attribute_values', 'tenant_id'],
  ['record_relations', 'tenant_id'],
  ['documents', 'tenant_id'],
  ['ai_memories', 'tenant_id'],
  ['invoices', 'tenant_id'],
  ['invoice_installments', 'tenant_id'],
  ['bank_transactions', 'tenant_id'],
  ['payment_allocations', 'tenant_id'],
  ['match_memories', 'tenant_id']
] as const;

async function main() {
  // Every table that holds tenant data must be listed above; fail loudly when one is forgotten.
  const tenantTables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `SELECT table_name FROM information_schema.columns WHERE table_schema = current_schema() AND column_name = 'tenant_id'`
  );
  const listed = new Set<string>(tables.map(([table]) => table));
  const missing = tenantTables.map((row) => row.table_name).filter((table) => !listed.has(table));
  if (missing.length) throw new Error(`Tables with tenant_id but no RLS policy: ${missing.join(', ')}`);

  for (const [table, tenantColumn] of tables) {
    const policy = `${table}_tenant_isolation`;
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
    await prisma.$executeRawUnsafe(`
      DO $policy$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE schemaname = current_schema()
            AND tablename = '${table}'
            AND policyname = '${policy}'
        ) THEN
          CREATE POLICY "${policy}" ON "${table}"
            USING ("${tenantColumn}"::text = current_setting('app.tenant_id', true))
            WITH CHECK ("${tenantColumn}"::text = current_setting('app.tenant_id', true));
        END IF;
      END
      $policy$;
    `);
  }
}

/**
 * Sign-in happens before the workspace is known, so a second, read-only policy lets a transaction that has
 * set app.auth_email see exactly the user with that email, and nothing else.
 */
async function applyAuthLookupPolicy() {
  await prisma.$executeRawUnsafe(`
    DO $policy$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'users' AND policyname = 'users_auth_lookup'
      ) THEN
        CREATE POLICY "users_auth_lookup" ON "users" FOR SELECT
          USING ("email" = current_setting('app.auth_email', true));
      END IF;
    END
    $policy$;
  `);
}

main()
  .then(applyAuthLookupPolicy)
  .catch((error: unknown) => {
    console.error('Failed to apply tenant RLS policies', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());