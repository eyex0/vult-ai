import { prisma } from '../src/index.js';

/**
 * Fails when a table that holds workspace data is not protected: row-level security must be enabled and forced,
 * with at least one policy. Run after migrations in CI and before each deploy.
 */
async function main() {
  const rows = await prisma.$queryRawUnsafe<{ table_name: string; enabled: boolean; forced: boolean; policies: number }[]>(`
    SELECT c.relname AS table_name, c.relrowsecurity AS enabled, c.relforcerowsecurity AS forced,
           (SELECT count(*)::int FROM pg_policies p WHERE p.schemaname = n.nspname AND p.tablename = c.relname) AS policies
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = current_schema() AND c.relkind = 'r'
      AND (EXISTS (SELECT 1 FROM information_schema.columns col
                   WHERE col.table_schema = n.nspname AND col.table_name = c.relname AND col.column_name = 'tenant_id')
           OR c.relname = 'tenants')
    ORDER BY 1`);
  const bad = rows.filter((r) => !r.enabled || !r.forced || r.policies === 0);
  if (!rows.length) throw new Error('No tenant tables found: are migrations applied?');
  if (bad.length) throw new Error(`Tables without row-level security: ${bad.map((r) => r.table_name).join(', ')}`);
  console.log(`Row-level security OK on ${rows.length} tables`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
