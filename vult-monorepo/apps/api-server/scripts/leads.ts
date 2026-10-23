/** Prints early-access requests as CSV:  pnpm --filter @vult/api-server leads > leads.csv */
import { prisma } from '@vult/database';

const cell = (v: unknown) => {
  const s = v instanceof Date ? v.toISOString() : String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const rows = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
const cols = ['createdAt', 'name', 'email', 'company', 'role', 'invoicesPerMonth', 'language', 'source', 'message'] as const;
console.log(cols.join(','));
for (const r of rows) console.log(cols.map((c) => cell(r[c])).join(','));
await prisma.$disconnect();
