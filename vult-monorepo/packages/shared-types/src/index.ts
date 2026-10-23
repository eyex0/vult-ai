export type TenantContext = {
  tenantId: string;
  userId: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'READ_ONLY';
};

export type AttributeType =
  | 'TEXT'
  | 'NUMBER'
  | 'CURRENCY'
  | 'STATUS'
  | 'DATE'
  | 'BOOLEAN'
  | 'USER_REF'
  | 'OBJECT_REF';

export type AttributeValueInput = {
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  jsonValue?: Record<string, unknown> | null;
};

export type RecordCreatePayload = {
  objectSlug: string;
  attributes: Record<string, unknown>;
};

export type SdiPaymentMethod = 'transfer' | 'riba' | 'direct_debit' | 'cash' | 'card' | 'other';

/** One DettaglioPagamento: what the customer must pay, when and how. */
export type SdiPaymentInstallment = {
  /** YYYY-MM-DD */
  dueDate: string;
  /** Euros, as written in the invoice. */
  amount: number;
  /** FatturaPA code, e.g. MP05 (bonifico) or MP12 (Ri.Ba.). */
  methodCode: string;
  method: SdiPaymentMethod;
  iban?: string;
};

export type SdiInvoiceSummary = {
  /** Customer (CessionarioCommittente). */
  vatNumber: string;
  taxCode: string;
  sdiCode: string;
  companyName: string;
  invoiceNumber: string;
  invoiceAmount: number;
  currency: string;
  /** TipoDocumento, e.g. TD01 invoice, TD04 credit note. */
  documentType: string;
  kind: 'invoice' | 'credit_note';
  /** YYYY-MM-DD */
  invoiceDate: string;
  seller: { vatNumber: string; name: string };
  taxAmount: number;
  /** Ritenuta d'acconto kept by the customer. */
  withholdingAmount: number;
  /** Scissione dei pagamenti: the customer pays the VAT to the state. */
  splitPayment: boolean;
  /** Never empty: derived from the total when the invoice has no DatiPagamento. */
  installments: SdiPaymentInstallment[];
  /** True when due dates were not in the invoice and were assumed. */
  installmentsEstimated: boolean;
};
export * from './plans.js';
