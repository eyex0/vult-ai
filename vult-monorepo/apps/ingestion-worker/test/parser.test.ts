import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractInvoiceXml } from '../src/p7m.js';
import { parseSdiXmlInvoice, parseSdiXmlInvoices, paymentMethod } from '../src/parser.js';

// Fixtures are fictional invoices; the .p7m files are signed with a throwaway test certificate.
const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url));

describe('parseSdiXmlInvoices', () => {
  it('reads customer, seller, totals and Ri.Ba. installments', async () => {
    const invoice = await parseSdiXmlInvoice(fixture('riba-two-installments.xml').toString('utf8'));
    expect(invoice).toMatchObject({
      vatNumber: '00000000101',
      companyName: 'Pastificio Aurora S.r.l.',
      invoiceNumber: '2025/118',
      invoiceDate: '2025-02-14',
      invoiceAmount: 2440,
      taxAmount: 440,
      kind: 'invoice',
      seller: { vatNumber: '00000000909', name: 'Distribuzioni Demo S.r.l.' },
      installmentsEstimated: false,
    });
    expect(invoice.installments).toEqual([
      { dueDate: '2025-03-31', amount: 1220, methodCode: 'MP12', method: 'riba' },
      { dueDate: '2025-04-30', amount: 1220, methodCode: 'MP12', method: 'riba' },
    ]);
  });

  it('reads every invoice of a batch, with withholding tax, credit notes and split payment', async () => {
    const [fee, credit] = await parseSdiXmlInvoices(fixture('batch-credit-note-withholding.xml').toString('utf8'));
    // No ImportoTotaleDocumento and no DatiPagamento: total from the summary, due in 30 days, net of withholding.
    expect(fee).toMatchObject({ invoiceAmount: 1220, withholdingAmount: 200, kind: 'invoice', installmentsEstimated: true });
    expect(fee!.seller.name).toBe('Giulia Demo');
    expect(fee!.installments).toEqual([{ dueDate: '2025-03-31', amount: 1020, methodCode: 'MP05', method: 'transfer' }]);
    expect(credit).toMatchObject({ documentType: 'TD04', kind: 'credit_note', splitPayment: true, invoiceNumber: 'NC-2' });
    expect(credit!.installments).toEqual([{ dueDate: '2025-05-04', amount: 100, methodCode: 'MP05', method: 'transfer', iban: 'IT00X0000000000000000000909' }]);
  });

  it('rejects entity declarations and other roots', async () => {
    await expect(parseSdiXmlInvoice('<!DOCTYPE x [<!ENTITY a "b">]><x/>')).rejects.toThrow(/DTD/);
    await expect(parseSdiXmlInvoice('<Other/>')).rejects.toThrow(/root/);
  });

  it('maps payment method codes', () => {
    expect(paymentMethod('MP05')).toBe('transfer');
    expect(paymentMethod('MP12')).toBe('riba');
    expect(paymentMethod('MP21')).toBe('direct_debit');
    expect(paymentMethod('MP23')).toBe('other');
  });
});

describe('signed invoices (.p7m)', () => {
  const xml = fixture('riba-two-installments.xml').toString('utf8');

  it.each(['riba-two-installments.xml.p7m', 'riba-streamed.xml.p7m', 'riba-base64.xml.p7m'])('extracts the XML from %s', async (name) => {
    expect(extractInvoiceXml(fixture(name))).toBe(xml);
    expect((await parseSdiXmlInvoice(fixture(name))).invoiceNumber).toBe('2025/118');
  });

  it('joins an OCTET STRING split into many BER chunks', () => {
    const bytes = Buffer.from(xml, 'utf8');
    const chunks: Buffer[] = [];
    for (let i = 0; i < bytes.length; i += 500) {
      const part = bytes.subarray(i, i + 500);
      chunks.push(Buffer.from([0x04, 0x82, part.length >> 8, part.length & 0xff]), part);
    }
    const ber = Buffer.concat([
      Buffer.from([0x30, 0x80, 0xa0, 0x80, 0x24, 0x80]),
      ...chunks,
      Buffer.from([0, 0, 0, 0, 0, 0]),
    ]);
    expect(extractInvoiceXml(ber)).toBe(xml);
  });

  it('fails cleanly on garbage', () => {
    expect(() => extractInvoiceXml(Buffer.from([0x30, 0x84, 0xff, 0xff, 0xff, 0xff]))).toThrow(/length/);
    expect(() => extractInvoiceXml(Buffer.from([0x30, 0x03, 0x02, 0x01, 0x00]))).toThrow(/No invoice/);
  });
});
