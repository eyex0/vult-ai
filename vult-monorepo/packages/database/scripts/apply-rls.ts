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
  ['ai_memories', 'tenant_id']
] as const;

async function main() {
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

main()
  .catch((error: unknown) => {
    console.error('Failed to apply tenant RLS policies', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());