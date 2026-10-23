import type { BankTransaction, Cents } from './types.js';

/** Splits CSV text into rows, honouring quotes and doubled quotes. */
function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

/** "1.234,56", "-1,234.56", "€ 1234.5", "1.234" (Italian thousands) -> cents. */
export function parseAmount(raw: string): Cents | null {
  let s = raw.replace(/[€\s]|EUR/gi, '');
  const negative = /^-|^\(.*\)$|-$/.test(s);
  s = s.replace(/[()+-]/g, '');
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastComma >= 0) {
    s = /,\d{1,2}$/.test(s) ? s.replace(/,(?=\d{1,2}$)/, '.').replace(/,/g, '') : s.replace(/,/g, '');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return negative ? -cents : cents;
}

/** "31/12/2025", "31-12-25", "31.12.2025", "2025-12-31" -> "2025-12-31". */
export function parseDate(raw: string): string | null {
  const s = raw.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})$/.exec(s);
  if (!m) return null;
  const year = m[3]!.length === 2 ? `20${m[3]}` : m[3]!;
  const month = Number(m[2]);
  const day = Number(m[1]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const strip = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]+/g, ' ').trim().replace(/\s+/g, ' ');

const COLUMNS = {
  date: ['data contabile', 'data operazione', 'data registrazione', 'booking date', 'date', 'data', 'data valuta', 'value date'],
  amount: ['importo', 'importo eur', 'amount', 'importo in euro', 'saldo movimento'],
  credit: ['entrate', 'accrediti', 'avere', 'credit', 'credits', 'money in'],
  debit: ['uscite', 'addebiti', 'dare', 'debit', 'debits', 'money out'],
  description: ['descrizione', 'descrizione operazione', 'causale', 'description', 'details', 'dettagli', 'remittance information', 'informazioni', 'note'],
  counterparty: ['controparte', 'ordinante', 'beneficiario', 'ordinante beneficiario', 'counterparty', 'counterparty name', 'payer', 'name', 'nome'],
  iban: ['iban', 'iban controparte', 'iban ordinante', 'counterparty iban', 'counterparty account'],
} as const;

function findColumn(headers: string[], names: readonly string[]): number {
  for (const name of names) {
    const i = headers.indexOf(name);
    if (i >= 0) return i;
  }
  return -1;
}

/** Italian statements often only name the payer inside the description: "BONIFICO DA ROSSI SRL PER ...". */
export function counterpartyFromText(description: string): string {
  const m = /\b(?:DA|ORD(?:INANTE)?|FROM|BEN(?:EFICIARIO)?)[:.]?\s+([A-Z0-9][A-Z0-9 .&'\-]{2,60}?)(?=\s+(?:PER|RIF|CAUS|CAUSALE|IBAN|TRN|CRO|DATA|FT|FATT|SALDO|PAGAMENTO)\b|\s*$|[,;/])/i.exec(description);
  return m ? m[1]!.trim() : '';
}

function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export interface CsvResult {
  transactions: BankTransaction[];
  /** Rows that could not be read, with the reason. */
  skipped: { row: number; reason: string }[];
}

/** Reads a bank statement exported as CSV from Italian or English home banking. */
export function parseBankCsv(text: string): CsvResult {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = [';', '\t', ','].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0]!;
  const rows = parseRows(clean, delimiter);
  const headerAt = rows.findIndex((r) => r.map(strip).some((h) => (COLUMNS.date as readonly string[]).includes(h)));
  if (headerAt < 0) return { transactions: [], skipped: [{ row: 1, reason: 'No date column found' }] };
  const headers = rows[headerAt]!.map(strip);
  const col = {
    date: findColumn(headers, COLUMNS.date),
    amount: findColumn(headers, COLUMNS.amount),
    credit: findColumn(headers, COLUMNS.credit),
    debit: findColumn(headers, COLUMNS.debit),
    description: headers.map((h, i) => ((COLUMNS.description as readonly string[]).includes(h) ? i : -1)).filter((i) => i >= 0),
    counterparty: findColumn(headers, COLUMNS.counterparty),
    iban: findColumn(headers, COLUMNS.iban),
  };
  const transactions: BankTransaction[] = [];
  const skipped: CsvResult['skipped'] = [];
  if (col.amount < 0 && col.credit < 0) return { transactions, skipped: [{ row: headerAt + 1, reason: 'No amount column found' }] };

  rows.slice(headerAt + 1).forEach((r, k) => {
    const rowNo = headerAt + k + 2;
    const date = parseDate(r[col.date] ?? '');
    let amount: Cents | null = null;
    if (col.amount >= 0) amount = parseAmount(r[col.amount] ?? '');
    else {
      const credit = parseAmount(r[col.credit] ?? '') ?? 0;
      const debit = col.debit >= 0 ? parseAmount(r[col.debit] ?? '') ?? 0 : 0;
      amount = credit - Math.abs(debit);
    }
    if (!date) return skipped.push({ row: rowNo, reason: 'Unreadable date' });
    if (amount === null || amount === 0) return skipped.push({ row: rowNo, reason: 'Unreadable or zero amount' });
    const description = col.description.map((i) => (r[i] ?? '').trim()).filter(Boolean).join(' ');
    const counterpartyName = (col.counterparty >= 0 ? r[col.counterparty]?.trim() : '') || counterpartyFromText(description);
    const iban = col.iban >= 0 ? r[col.iban]?.replace(/\s+/g, '') : undefined;
    transactions.push({
      id: `tx-${hash(`${date}|${amount}|${description}|${counterpartyName}|${rowNo}`)}`,
      date,
      amount,
      counterpartyName,
      ...(iban ? { counterpartyIban: iban } : {}),
      description,
    });
  });
  return { transactions, skipped };
}
