/** Money is always integer euro cents inside the engine. */
export type Cents = number;

export type PaymentMethod = 'transfer' | 'riba' | 'direct_debit' | 'cash' | 'card' | 'other';

/** One payable installment of an issued invoice, or a credit note that reduces what the customer owes. */
export interface OpenItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  /** YYYY-MM-DD */
  invoiceDate: string;
  customerVat: string;
  customerName: string;
  kind: 'invoice' | 'credit_note';
  /** Amount the customer is expected to pay for this installment (already net of withholding and split-payment VAT). Always positive. */
  amount: Cents;
  /** YYYY-MM-DD */
  dueDate: string;
  method: PaymentMethod;
  /** Withholding tax (ritenuta d'acconto) the customer keeps; informational. */
  withholding?: Cents;
  /** VAT paid by the customer directly to the state (scissione dei pagamenti). */
  splitPayment?: boolean;
}

export interface BankTransaction {
  id: string;
  /** Booking date, YYYY-MM-DD */
  date: string;
  /** Positive for money in, negative for money out. */
  amount: Cents;
  counterpartyName: string;
  counterpartyIban?: string;
  description: string;
}

/** What the engine has learned from confirmed matches. Plain JSON so it can be stored anywhere. */
export interface MatchMemory {
  version: 1;
  /** Normalized payer IBAN -> customer VAT. */
  ibans: Record<string, string>;
  /** Normalized payer name -> customer VAT (a parent company or a factor paying for the customer). */
  aliases: Record<string, string>;
  /** Customer VAT -> early-payment discount the customer takes, in basis points (200 = 2%). */
  discounts: Record<string, number>;
}

export type ReasonCode =
  | 'known_iban'
  | 'known_alias'
  | 'vat_in_text'
  | 'name'
  | 'reference'
  | 'exact_amount'
  | 'unique_amount'
  | 'overpaid'
  | 'bank_fee'
  | 'discount'
  | 'credit_note'
  | 'withholding'
  | 'split_payment'
  | 'riba_batch'
  | 'riba_return'
  | 'partial'
  | 'ambiguous';

export interface Reason {
  code: ReasonCode;
  label: string;
}

/** Money applied to one open item. Negative for a credit note used up, or for a Ri.Ba. that came back unpaid. */
export interface Allocation {
  itemId: string;
  amount: Cents;
}

export interface Candidate {
  /** Null when the payment covers several customers (a Ri.Ba. batch). */
  customerVat: string | null;
  allocations: Allocation[];
  /** 0..1 */
  confidence: number;
  /** Transaction amount minus the allocated total: bank fees and discounts show up here. */
  difference: Cents;
  reasons: Reason[];
}

export type ProposalStatus = 'auto' | 'review' | 'unmatched';

export interface Proposal {
  transactionId: string;
  kind: 'payment' | 'riba_return' | 'outgoing';
  status: ProposalStatus;
  best: Candidate | null;
  alternatives: Candidate[];
}

export interface MatchOptions {
  /** Confidence needed to record a match without a person. */
  autoThreshold: number;
  /** Below this a candidate is only shown as a suggestion. */
  reviewThreshold: number;
  /** Largest bank fee the engine will explain away. */
  maxFee: Cents;
  /** Most invoices one transfer may settle. */
  maxCombination: number;
  /** Most open items searched per customer. */
  maxPool: number;
}

export interface ReconcileInput {
  items: OpenItem[];
  transactions: BankTransaction[];
  /** Amount already collected per item from earlier matches. */
  paid?: Record<string, Cents>;
  memory?: MatchMemory;
  options?: Partial<MatchOptions>;
}

export interface ReconcileResult {
  proposals: Proposal[];
  /** Open amount per item after the automatic matches of this run. */
  open: Record<string, Cents>;
}
