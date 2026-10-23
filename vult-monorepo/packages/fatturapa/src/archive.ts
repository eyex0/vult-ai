import { unzipSync } from 'fflate';
import type { SdiInvoiceSummary } from '@vult/shared-types';
import { parseSdiXmlInvoices } from './parser.js';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 300 * 1024 * 1024;
const MAX_FILES = 20_000;

export interface ArchiveResult {
  invoices: (SdiInvoiceSummary & { fileName: string })[];
  /** Files that were not invoices or could not be read. */
  skipped: { fileName: string; reason: string }[];
}

/** SDI receipts and metadata files ("..._MT_001.xml") travel next to the invoices but are not invoices. */
const isInvoiceFile = (name: string) => /\.(xml|xml\.p7m|p7m)$/i.test(name) && !/_(MT|RC|NS|MC|NE|DT|AT|EC|SE)_\d+\.xml$/i.test(name) && !name.startsWith('__MACOSX/');

/**
 * Reads the ZIP of invoices downloaded from the Agenzia delle Entrate portal (or any ZIP of FatturaPA files).
 * Sizes are checked from the ZIP directory before anything is decompressed, so a zip bomb is refused cheaply.
 */
export async function parseInvoiceArchive(zip: Uint8Array): Promise<ArchiveResult> {
  const skipped: ArchiveResult['skipped'] = [];
  let files = 0;
  let total = 0;
  const entries = unzipSync(zip, {
    filter: (file) => {
      if (!isInvoiceFile(file.name)) {
        if (!file.name.endsWith('/')) skipped.push({ fileName: file.name, reason: 'Not an invoice file' });
        return false;
      }
      if (file.originalSize > MAX_FILE_BYTES) {
        skipped.push({ fileName: file.name, reason: 'File larger than 5 MiB' });
        return false;
      }
      files++;
      total += file.originalSize;
      if (files > MAX_FILES || total > MAX_TOTAL_BYTES) throw new Error('Archive too large: split it into smaller ZIP files');
      return true;
    },
  });
  const invoices: ArchiveResult['invoices'] = [];
  for (const [fileName, bytes] of Object.entries(entries)) {
    try {
      const parsed = await parseSdiXmlInvoices(Buffer.from(bytes));
      invoices.push(...parsed.map((invoice) => ({ ...invoice, fileName })));
    } catch (error) {
      skipped.push({ fileName, reason: error instanceof Error ? error.message.replace(/^\[SDI Parser Error\] /, '') : 'Unreadable' });
    }
  }
  return { invoices, skipped };
}
