import { readFileSync } from 'node:fs';
import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { parseInvoiceArchive } from '../src/index.js';

const fixture = (name: string) => new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));

describe('parseInvoiceArchive', () => {
  it('reads XML and signed invoices and skips SDI receipts and junk', async () => {
    const zip = zipSync({
      'IT00000000909_00001.xml': fixture('riba-two-installments.xml'),
      'fatture/IT00000000909_00002.xml.p7m': fixture('riba-streamed.xml.p7m'),
      'IT00000000909_00003.xml': fixture('batch-credit-note-withholding.xml'),
      'IT00000000909_00001_MT_001.xml': new TextEncoder().encode('<MetadatiInvioFile/>'),
      'note.txt': new TextEncoder().encode('hello'),
      'broken.xml': new TextEncoder().encode('<FatturaElettronica>'),
    });
    const { invoices, skipped } = await parseInvoiceArchive(zip);
    expect(invoices.map((i) => `${i.fileName}:${i.invoiceNumber}`).sort()).toEqual([
      'IT00000000909_00001.xml:2025/118',
      'IT00000000909_00003.xml:9',
      'IT00000000909_00003.xml:NC-2',
      'fatture/IT00000000909_00002.xml.p7m:2025/118',
    ]);
    expect(skipped.map((s) => s.fileName).sort()).toEqual(['IT00000000909_00001_MT_001.xml', 'broken.xml', 'note.txt']);
  });

  it('refuses an oversized file before decompressing it', async () => {
    const zip = zipSync({ 'huge.xml': new Uint8Array(6 * 1024 * 1024) });
    const { invoices, skipped } = await parseInvoiceArchive(zip);
    expect(invoices).toEqual([]);
    expect(skipped).toEqual([{ fileName: 'huge.xml', reason: 'File larger than 5 MiB' }]);
  });
});
