import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Worker } from 'bullmq';
import { prisma, withTenantContext } from '@vult/database';
import { parseSdiXmlInvoices, saveSdiInvoices } from '@vult/fatturapa';
import { connection, type SdiInvoiceJob } from './queue.js';

const bucket = process.env.S3_BUCKET;
const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'eu-west-1',
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {})
});
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 4);

if (!bucket) throw new Error('S3_BUCKET must be configured before starting the ingestion worker');

const worker = new Worker<SdiInvoiceJob>('vult-document-ingestion', async (job) => {
  const { tenantId, objectKey, fileName } = job.data;
  if (!objectKey.startsWith(`tenants/${tenantId}/`)) throw new Error('Object key is outside the tenant storage prefix');
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));
  if (!response.Body) throw new Error('Invoice object has no readable body');
  // Bytes, not text: signed invoices (.p7m) are binary.
  const file = Buffer.from(await response.Body.transformToByteArray());
  const invoices = await parseSdiXmlInvoices(file);
  const invoice = invoices[0]!;

  const documentId = await withTenantContext(tenantId, async (tx) => {
    const companyType = await tx.objectType.findFirst({ where: { tenantId, slug: 'companies' } });
    let recordId: string | undefined;
    if (companyType && invoice.vatNumber) {
      const vatAttribute = await tx.attribute.findFirst({
        where: { tenantId, objectTypeId: companyType.id, slug: 'vat_number' }
      });
      if (vatAttribute) {
        const value = await tx.attributeValue.findFirst({
          where: { tenantId, attributeId: vatAttribute.id, textValue: invoice.vatNumber },
          select: { recordId: true }
        });
        recordId = value?.recordId;
      }
    }
    const document = await tx.document.create({
      data: {
        tenantId,
        recordId,
        title: `${invoice.companyName} · Fattura ${invoice.invoiceNumber}`,
        fileUrl: objectKey,
        docType: 'SDI_INVOICE_XML',
        parsedData: invoice
      },
      select: { id: true }
    });
    // Issued invoices become receivables for Vult Match; invoices received from suppliers are skipped.
    const tenant = await tx.tenant.findUnique({ where: { id: tenantId }, select: { vatNumber: true } });
    await saveSdiInvoices(tx, tenantId, invoices, { tenantVat: tenant?.vatNumber, documentId: document.id, recordId });
    return document.id;
  });

  const aiUrl = process.env.AI_ORCHESTRATOR_URL;
  const serviceToken = process.env.AI_SERVICE_TOKEN;
  if (aiUrl && serviceToken) {
    const response = await fetch(`${aiUrl}/api/v1/ai/ingest`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${serviceToken}`,
        'x-tenant-id': tenantId
      },
      body: JSON.stringify({
        content: `Fattura ${invoice.invoiceNumber}. Intestatario ${invoice.companyName}. Partita IVA ${invoice.vatNumber}. Importo ${invoice.invoiceAmount} ${invoice.currency}. Codice SDI ${invoice.sdiCode}.`,
        source_type: 'INVOICE',
        source_id: documentId
      }),
      signal: AbortSignal.timeout(20_000)
    });
    if (!response.ok) throw new Error(`AI memory ingestion returned ${response.status}`);
  }

  return { documentId, invoice };
}, { connection, concurrency, limiter: { max: 30, duration: 60_000 } });

worker.on('completed', (job, result) => console.info(`Ingested invoice ${job.id}`, result.documentId));
worker.on('failed', (job, error) => console.error(`Invoice job ${job?.id ?? 'unknown'} failed`, error.message));
console.info(`Vult ingestion worker listening with concurrency ${concurrency}`);

async function shutdown() {
  await worker.close();
  await connection.quit();
  await s3.destroy();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);