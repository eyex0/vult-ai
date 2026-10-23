import type { PrismaClient } from '@vult/database';
import type { SdiInvoiceSummary, SdiPaymentMethod } from '@vult/shared-types';

const METHOD: Record<SdiPaymentMethod, 'TRANSFER' | 'RIBA' | 'DIRECT_DEBIT' | 'CASH' | 'CARD' | 'OTHER'> = {
  transfer: 'TRANSFER',
  riba: 'RIBA',
  direct_debit: 'DIRECT_DEBIT',
  cash: 'CASH',
  card: 'CARD',
  other: 'OTHER',
};

const cents = (euros: number) => BigInt(Math.round(euros * 100));
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

export interface SaveResult {
  created: number;
  /** Already stored (same customer, number and date). */
  existing: number;
  /** Invoices the tenant received from suppliers: not receivables, so not stored here. */
  purchases: number;
}

/**
 * Stores issued invoices and their installments as receivables. Importing the same invoice twice is a no-op.
 * Call inside withTenantContext so row-level security applies.
 */
export async function saveSdiInvoices(
  db: Pick<PrismaClient, 'invoice'>,
  tenantId: string,
  invoices: SdiInvoiceSummary[],
  options: { tenantVat?: string | null; documentId?: string; recordId?: string } = {},
): Promise<SaveResult> {
  const result: SaveResult = { created: 0, existing: 0, purchases: 0 };
  const ownVat = options.tenantVat?.replace(/^IT/i, '');
  for (const invoice of invoices) {
    if (ownVat && invoice.seller.vatNumber && invoice.seller.vatNumber.replace(/^IT/i, '') !== ownVat) {
      result.purchases++;
      continue;
    }
    const customerVat = invoice.vatNumber || invoice.taxCode;
    const key = { tenantId, customerVat, number: invoice.invoiceNumber, issueDate: day(invoice.invoiceDate) };
    const found = await db.invoice.findUnique({ where: { tenantId_customerVat_number_issueDate: key }, select: { id: true } });
    if (found) {
      result.existing++;
      continue;
    }
    await db.invoice.create({
      data: {
        ...key,
        documentId: options.documentId,
        recordId: options.recordId,
        kind: invoice.kind === 'credit_note' ? 'CREDIT_NOTE' : 'INVOICE',
        documentType: invoice.documentType,
        customerName: invoice.companyName,
        currency: invoice.currency,
        totalCents: cents(invoice.invoiceAmount),
        withholdingCents: cents(invoice.withholdingAmount),
        splitPayment: invoice.splitPayment,
        installments: {
          // tenantId comes from the parent invoice through the composite relation.
          create: invoice.installments.map((inst, seq) => ({
            seq,
            dueDate: day(inst.dueDate),
            amountCents: cents(inst.amount),
            method: METHOD[inst.method],
            iban: inst.iban,
            estimated: invoice.installmentsEstimated,
          })),
        },
      },
    });
    result.created++;
  }
  return result;
}
