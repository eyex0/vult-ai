// Applies database migrations from inside a deployed API, then refuses to succeed if any table holding
// workspace data lacks row-level security. Used as the pre-deploy command on Render:  npm run migrate
// Uses MIGRATION_DATABASE_URL (the table owner) when set, else DATABASE_URL.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Set MIGRATION_DATABASE_URL (or DATABASE_URL) to the database owner connection string');
  process.exit(1);
}
const env = { ...process.env, DATABASE_URL: url };

// The database package ships its schema, migrations and the prisma CLI.
const dbPackage = join(dirname(fileURLToPath(import.meta.resolve('@vult/database'))), '..');
const require = createRequire(join(dbPackage, 'package.json'));
const prismaCli = require.resolve('prisma/build/index.js');
const migrate = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy', '--schema', join(dbPackage, 'prisma', 'schema.prisma')], { env, stdio: 'inherit' });
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

process.env.DATABASE_URL = url;
const { prisma } = await import('@vult/database');
const rows = await prisma.$queryRawUnsafe(`
  SELECT c.relname AS table_name, c.relrowsecurity AS enabled, c.relforcerowsecurity AS forced,
         (SELECT count(*)::int FROM pg_policies p WHERE p.schemaname = n.nspname AND p.tablename = c.relname) AS policies
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = current_schema() AND c.relkind = 'r'
    AND (EXISTS (SELECT 1 FROM information_schema.columns col WHERE col.table_schema = n.nspname AND col.table_name = c.relname AND col.column_name = 'tenant_id')
         OR c.relname = 'tenants')`);
const app = await prisma.$queryRawUnsafe(`SELECT rolbypassrls, rolsuper FROM pg_roles WHERE rolname = 'vult_app'`);
await prisma.$disconnect();
const bad = rows.filter((r) => !r.enabled || !r.forced || r.policies === 0);
if (!rows.length || bad.length) {
  console.error(`Row-level security missing on: ${bad.map((r) => r.table_name).join(', ') || 'all tables'}`);
  process.exit(1);
}
if (!app.length) console.warn('Warning: role vult_app does not exist. Create it and point DATABASE_URL at it, or the API runs as the table owner.');
else if (app[0].rolbypassrls || app[0].rolsuper) {
  console.error('Role vult_app can bypass row-level security: recreate it with NOSUPERUSER NOBYPASSRLS');
  process.exit(1);
}
console.log(`Migrations applied; row-level security OK on ${rows.length} tables`);
