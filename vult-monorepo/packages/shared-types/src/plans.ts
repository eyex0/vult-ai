/** Vult's paid plans. The API enforces the limits; the website shows the same numbers. */
export type PlanId = 'START' | 'GROWTH' | 'SCALE';

export interface Plan {
  id: PlanId;
  name: string;
  /** Euros per month, VAT excluded. */
  monthly: number;
  /** Invoices imported per calendar month; null means no limit. */
  invoiceLimit: number | null;
  users: number | null;
  blurb: string;
  features: string[];
}

export const TRIAL_DAYS = 30;
/** During the trial a workspace gets the Growth limits. */
export const TRIAL_INVOICE_LIMIT = 1_000;

export const PLANS: Plan[] = [
  {
    id: 'START',
    name: 'Start',
    monthly: 99,
    invoiceLimit: 200,
    users: 3,
    blurb: 'For small companies that want every payment matched without spreadsheets.',
    features: ['200 invoices a month', 'Bank statement import (camt, CSV)', 'Automatic payment matching', 'Customer balances and overdue list', '3 users'],
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    monthly: 249,
    invoiceLimit: 1_000,
    users: 10,
    blurb: 'For teams that sell on credit and need cash in faster.',
    features: ['1,000 invoices a month', 'Everything in Start', 'Commissions on collected revenue', 'Signed .p7m and AdE ZIP import', '10 users'],
  },
  {
    id: 'SCALE',
    name: 'Scale',
    monthly: 599,
    invoiceLimit: null,
    users: null,
    blurb: 'For distributors and manufacturers with high invoice volume.',
    features: ['Unlimited invoices', 'Everything in Growth', 'API access', 'Priority support', 'Unlimited users'],
  },
];

export const planById = (id: string | null | undefined) => PLANS.find((p) => p.id === id);
