import type { BankTransaction, OpenItem } from "@vult/match";

/** Fictional demo data for Vult Match: companies, VAT numbers and IBANs are made up. Amounts are euro cents. */
export const MATCH_TODAY = "2026-10-23";

export const DEMO_CUSTOMERS = [
  { vat: "00000000101", name: "Pastificio Aurora S.r.l.", ownerId: "m2" },
  { vat: "00000000202", name: "Officine Brenta S.p.A.", ownerId: "m3" },
  { vat: "00000000303", name: "Studio Luce S.n.c.", ownerId: "m2" },
  { vat: "00000000404", name: "Caseificio Valle Verde S.r.l.", ownerId: "m3" },
  { vat: "00000000505", name: "Ferramenta Colombo S.a.s.", ownerId: "m5" },
  { vat: "00000000606", name: "Hotel Belvedere S.r.l.", ownerId: "m5" },
  { vat: "00000000707", name: "Enoteca San Marco S.r.l.", ownerId: "m2" },
] as const;

/** Sales commission on collected revenue, per agent. */
export const COMMISSION_RATE = 0.05;

const customer = (vat: string) => DEMO_CUSTOMERS.find((c) => c.vat === vat)!;

function item(vat: string, number: string, invoiceDate: string, euros: number, dueDate: string, extra: Partial<OpenItem> = {}): OpenItem {
  return {
    id: `inst-${number.replace(/\W/g, "")}`,
    invoiceId: `inv-${number.replace(/\W/g, "")}`,
    invoiceNumber: number,
    invoiceDate,
    customerVat: vat,
    customerName: customer(vat).name,
    kind: "invoice",
    amount: Math.round(euros * 100),
    dueDate,
    method: "transfer",
    ...extra,
  };
}

export const DEMO_ITEMS: OpenItem[] = [
  item("00000000101", "2026/118", "2026-08-31", 3050, "2026-09-30"),
  item("00000000101", "2026/131", "2026-09-15", 1980, "2026-10-15"),
  item("00000000101", "2026/140", "2026-09-30", 2400, "2026-10-31"),
  item("00000000101", "2026/152", "2026-10-15", 1150, "2026-11-15"),
  item("00000000202", "2026/120", "2026-08-31", 4000, "2026-09-30"),
  item("00000000202", "2026/125", "2026-09-05", 2500, "2026-09-30"),
  item("00000000202", "NC 2026/7", "2026-09-20", 300, "2026-09-20", { kind: "credit_note" }),
  item("00000000202", "2026/141", "2026-09-15", 2450.5, "2026-10-15", { method: "riba" }),
  item("00000000202", "2026/158", "2026-10-20", 6100, "2026-11-30", { method: "riba" }),
  item("00000000303", "2026/122", "2026-09-02", 1000, "2026-10-02"),
  item("00000000303", "2026/150", "2026-10-01", 5000, "2026-10-31"),
  // Net of the €250 withholding tax the customer keeps, as the invoice reader stores it.
  item("00000000303", "2026/153", "2026-10-05", 1275, "2026-11-04", { withholding: 250_00 }),
  item("00000000404", "2026/123", "2026-09-15", 1100, "2026-10-15", { method: "riba" }),
  item("00000000404", "2026/135", "2026-09-20", 3600, "2026-10-20"),
  item("00000000505", "2026/124", "2026-09-15", 610, "2026-10-15", { method: "riba" }),
  item("00000000505", "2026/138", "2026-09-30", 890, "2026-10-30"),
  item("00000000606", "2026/144", "2026-09-30", 890, "2026-10-30"),
  item("00000000606", "2026/109", "2026-08-10", 2200, "2026-09-09"),
  item("00000000707", "2026/147", "2026-10-02", 1340, "2026-11-01"),
];

let n = 0;
function tx(date: string, euros: number, counterpartyName: string, description: string, counterpartyIban?: string): BankTransaction {
  n++;
  return { id: `demo-tx-${n}`, date, amount: Math.round(euros * 100), counterpartyName, description, ...(counterpartyIban ? { counterpartyIban } : {}) };
}

export const DEMO_TRANSACTIONS: BankTransaction[] = [
  tx("2026-09-30", 3050, "PASTIFICIO AURORA S", "BONIFICO A VOSTRO FAVORE", "IT00X0000000000000000000101"),
  tx("2026-10-15", 1980, "PASTIFICIO AURORA S", "BONIFICO A VOSTRO FAVORE", "IT00X0000000000000000000101"),
  tx("2026-10-02", 6200, "OFFICINE BRENTA SPA", "SALDO FT 120 125 MENO NOSTRA NC 7"),
  tx("2026-10-14", 4160.5, "BANCA DEL TERRITORIO", "ACCREDITO DISTINTA RIBA SBF N 41"),
  tx("2026-10-21", -617.5, "BANCA DEL TERRITORIO", "INSOLUTO RIBA FERRAMENTA COLOMBO SCAD 15/10/2026"),
  tx("2026-10-03", 980, "STUDIO LUCE SNC", "PAGAMENTO FT 122 SCONTO 2%"),
  tx("2026-10-12", 2400, "GRUPPO ALIMENTARE NORD HOLDING SPA", "PAGAMENTO FT 2026/140"),
  tx("2026-10-22", 1150, "GRUPPO ALIMENTARE NORD HOLDING SPA", "PAGAMENTO FT 2026/152"),
  tx("2026-10-20", 1200, "CASEIFICIO VALLE VERDE SRL", "ACCONTO FT 135"),
  tx("2026-10-23", 890, "MARIO ROSSI", "BONIFICO"),
  tx("2026-10-05", -1240, "ENEL ENERGIA SPA", "ADDEBITO SDD BOLLETTA LUCE"),
  tx("2026-10-18", 4900, "STUDIO LUCE SNC", "FT 150"),
  tx("2026-10-09", 350, "AMAZON PAYMENTS EUROPE", "RIMBORSO ORDINE 402-1"),
  tx("2026-09-12", 2197.5, "HOTEL BELVEDERE SRL", "BONIFICO FT 109", "IT00X0000000000000000000606"),
  tx("2026-10-22", 1275, "STUDIO LUCE SNC", "FT 153 AL NETTO DI RITENUTA"),
];
