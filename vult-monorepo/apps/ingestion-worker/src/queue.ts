import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export type SdiInvoiceJob = {
  tenantId: string;
  objectKey: string;
  fileName: string;
};

const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
});

export const ingestionQueue = new Queue<SdiInvoiceJob>('vult-document-ingestion', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2_000 },
    removeOnComplete: { age: 86_400, count: 5_000 },
    removeOnFail: { age: 604_800, count: 10_000 }
  }
});

export async function enqueueSdiInvoice(job: SdiInvoiceJob) {
  if (!job.tenantId || !job.objectKey.startsWith(`tenants/${job.tenantId}/`)) {
    throw new Error('Invoice object key must be scoped to the supplied tenant');
  }
  return ingestionQueue.add('parse-sdi-invoice', job, {
    jobId: `sdi-${job.tenantId}-${job.objectKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`
  });
}

export { connection };