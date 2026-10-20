import { randomUUID } from 'node:crypto';
import { prisma, withTenantContext } from '../src/index.js';

async function main() {
  const tenantId = process.env.SEED_TENANT_ID ?? '3a6d1010-2cbb-4e13-96a8-b2f0789a1f01';
  const userId = 'a1f8792e-0b79-4d8b-aa4a-44c2345c81fa';

  await withTenantContext(tenantId, async (tx) => {
    await tx.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'Demo workspace', legalName: 'Vult Demo S.r.l.' }
    });
    await tx.user.upsert({
      where: { tenantId_email: { tenantId, email: 'demo@vult.local' } },
      update: {},
      create: { id: userId, tenantId, email: 'demo@vult.local', name: 'Demo User', role: 'ADMIN' }
    });

    const companies = await tx.objectType.upsert({
      where: { tenantId_slug: { tenantId, slug: 'companies' } },
      update: {},
      create: {
        tenantId,
        name: 'Companies',
        slug: 'companies',
        isSystem: true,
        attributes: {
          create: [
            { name: 'Company name', slug: 'name', dataType: 'TEXT', isRequired: true },
            { name: 'Partita IVA', slug: 'vat_number', dataType: 'TEXT' },
            { name: 'Industry', slug: 'industry', dataType: 'STATUS' }
          ]
        }
      }
    });
    const deals = await tx.objectType.upsert({
      where: { tenantId_slug: { tenantId, slug: 'deals' } },
      update: {},
      create: {
        tenantId,
        name: 'Deals',
        slug: 'deals',
        isSystem: true,
        attributes: {
          create: [
            { name: 'Deal name', slug: 'name', dataType: 'TEXT', isRequired: true },
            { name: 'Stage', slug: 'stage', dataType: 'STATUS' },
            { name: 'Value', slug: 'value', dataType: 'CURRENCY' }
          ]
        }
      }
    });

    const seedObject = async (objectTypeId: string, rows: Record<string, unknown>[]) => {
      if (await tx.record.count({ where: { tenantId, objectTypeId } })) return;
      const attributes = await tx.attribute.findMany({ where: { tenantId, objectTypeId } });
      const ids = Object.fromEntries(attributes.map((attribute) => [attribute.slug, attribute.id]));
      for (const row of rows) {
        const recordId = randomUUID();
        await tx.record.create({ data: { id: recordId, tenantId, objectTypeId } });
        await tx.attributeValue.createMany({
          data: Object.entries(row).map(([slug, value]) => ({
            recordId,
            tenantId,
            objectTypeId,
            attributeId: ids[slug],
            ...(slug === 'value' ? { decimalValue: String(value) } : { textValue: String(value) })
          }))
        });
      }
    };

    await seedObject(companies.id, [
      { name: 'Barilla S.p.A.', vat_number: '01654010345', industry: 'Food manufacturing' },
      { name: 'Acme Logistica S.r.l.', vat_number: '09123450961', industry: 'Logistics' },
      { name: 'Nexa Systems S.p.A.', vat_number: '10456780962', industry: 'Software' }
    ]);
    await seedObject(deals.id, [
      { name: 'Rinnovo piattaforma Q4', stage: 'Negoziazione', value: '84000.00' }
    ]);
  });
  console.log(`Seeded demo tenant ${tenantId} and user ${userId}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());