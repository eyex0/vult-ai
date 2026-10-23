import type { Cents } from './types.js';

/** Uppercase, strip accents and dots ("S.r.l." -> "SRL", "RI.BA." -> "RIBA"), collapse everything else to single spaces. */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/[^A-Z0-9/\-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const LEGAL_WORDS = new Set([
  'SRL', 'SRLS', 'SPA', 'SAPA', 'SNC', 'SAS', 'SCARL', 'SCRL', 'SCPA', 'SOC', 'SOCIETA', 'COOP', 'COOPERATIVA',
  'UNIPERSONALE', 'SU', 'SEMPLIFICATA', 'RESPONSABILITA', 'LIMITATA', 'AZIONI', 'ACCOMANDITA', 'SEMPLICE',
  'COLLETTIVO', 'IN', 'NOME', 'PER', 'DI', 'DEL', 'DELLA', 'DEI', 'E', 'ED', 'THE', 'AND', 'LTD', 'LLC', 'INC',
  'GMBH', 'SA', 'BV', 'SL', 'SARL',
]);

/** Name tokens without legal forms and filler words. */
export function nameTokens(name: string): string[] {
  return normalizeText(name)
    .split(/[\s/\-]+/)
    .filter((t) => t.length > 1 && !LEGAL_WORDS.has(t));
}

export function normalizeName(name: string): string {
  return nameTokens(name).join(' ');
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * Bank statements cut names short and misspell them. A word may be a 4+ letter prefix of the other only when it
 * is the last word of its name (where the cut happens); long words may differ by one typo; words with digits
 * must be equal ("NUMERO5" is not "NUMERO50").
 */
function tokensMatch(a: string, b: string, aLast: boolean, bLast: boolean): boolean {
  if (a === b) return true;
  if (/\d/.test(a) || /\d/.test(b)) return false;
  if (a.length >= 4 && b.length >= 4) {
    if (b.length < a.length && bLast && a.startsWith(b)) return true;
    if (a.length < b.length && aLast && b.startsWith(a)) return true;
  }
  return a.length >= 6 && b.length >= 6 && editDistanceAtMostOne(a, b);
}

/** Dice similarity of two token lists, 0..1. */
export function tokenSimilarity(ta: string[], tb: string[]): number {
  if (!ta.length || !tb.length) return 0;
  const used = new Set<number>();
  let matches = 0;
  ta.forEach((x, i) => {
    const k = tb.findIndex((y, j) => !used.has(j) && tokensMatch(x, y, i === ta.length - 1, j === tb.length - 1));
    if (k >= 0) {
      used.add(k);
      matches++;
    }
  });
  return (2 * matches) / (ta.length + tb.length);
}

/** Dice similarity of two company names, 0..1. */
export function nameSimilarity(a: string, b: string): number {
  return tokenSimilarity(nameTokens(a), nameTokens(b));
}

/** Share of the customer's name tokens found anywhere in a free-text description, 0..1. */
export function tokenCoverage(customer: string[], text: string[]): number {
  if (!customer.length || !text.length) return 0;
  const hits = customer.filter((x, i) => text.some((y, j) => tokensMatch(x, y, i === customer.length - 1, j === text.length - 1))).length;
  return hits / customer.length;
}

export function nameCoverage(customerName: string, text: string): number {
  return tokenCoverage(nameTokens(customerName), nameTokens(text));
}

export function normalizeIban(iban: string | undefined): string {
  return (iban ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** "IT01234567890" and "01234567890" are the same Partita IVA. */
export function normalizeVat(vat: string): string {
  const v = vat.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^IT\d{11}$/.test(v) ? v.slice(2) : v;
}

/** Partite IVA (11 digits) and codici fiscali (16 characters) written in a description. */
export function taxIdsInText(text: string): string[] {
  const t = normalizeText(text);
  const ids = new Set<string>();
  for (const m of t.matchAll(/(?:^|[^0-9])(?:IT)?(\d{11})(?![0-9])/g)) ids.add(m[1]!);
  for (const m of t.matchAll(/\b([A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z])\b/g)) ids.add(m[1]!);
  return [...ids];
}

export interface InvoiceRef {
  /** Invoice number without leading zeros or prefix letters. */
  n: string;
  year?: string;
}

const isYear = (s: string) => /^20\d{2}$/.test(s);

/** "2025/118", "118/2025", "118/25", "FV-118", "2025-00118" -> number and optional year. */
export function parseInvoiceNumber(raw: string): InvoiceRef | null {
  const refs = numberTokenRefs(normalizeText(raw).replace(/\s+/g, ''));
  return refs.length === 1 ? refs[0]! : refs.find((r) => r.year) ?? refs[0] ?? null;
}

function numberTokenRefs(token: string): InvoiceRef[] {
  const t = token.replace(/^[A-Z]{1,4}/, '').replace(/^[/\-]+/, '');
  if (!/^\d[\d/\-A-Z]*$/.test(t)) return [];
  const parts = t.split(/[/\-]/).map((p) => p.replace(/[A-Z]+/g, '')).filter(Boolean);
  if (!parts.length || parts.some((p) => !/^\d{1,8}$/.test(p))) return [];
  const strip = (p: string) => p.replace(/^0+(?=\d)/, '');
  // A dd/mm/yyyy date is not an invoice number.
  if (parts.length === 3 && isYear(parts[2]!) && Number(parts[0]) <= 31 && Number(parts[1]) <= 12) return [];
  if (parts.length === 2) {
    const [a, b] = parts as [string, string];
    if (isYear(a)) return [{ n: strip(b), year: a }];
    if (isYear(b)) return [{ n: strip(a), year: b }];
    if (b.length === 2 && token.includes('/') && Number(b) >= 15 && Number(b) <= 40) return [{ n: strip(a), year: `20${b}` }];
  }
  const year = parts.find(isYear);
  return parts.filter((p) => p !== year).map((p) => (year ? { n: strip(p), year } : { n: strip(p) }));
}

const REF_KEYWORDS = new Set([
  'FT', 'FAT', 'FATT', 'FATTURA', 'FATTURE', 'FV', 'FTT', 'RIF', 'RIFERIMENTO', 'RIFERIMENTI', 'NR', 'NUM', 'NUMERO',
  'N', 'DOC', 'DOCUMENTO', 'DOCUMENTI', 'INV', 'INVOICE', 'INVOICES', 'SALDO', 'ACCONTO', 'PAGAMENTO',
]);
const LIST_JOINERS = new Set(['E', 'ED', 'AND', 'N', 'NR', 'FT', 'FATT', 'FATTURA', 'FATTURE', 'NUM', 'NUMERO', 'RIF']);
const LIST_STOPPERS = new Set(['DEL', 'DATA', 'DATATA', 'DATED', 'SCAD', 'SCADENZA', 'DD', 'IMPORTO', 'EUR']);

/** Invoice numbers a customer wrote in the transfer description. Bare numbers only count after a keyword like "FT" or "RIF", so amounts and dates are ignored. */
export function extractReferences(description: string): InvoiceRef[] {
  const tokens = normalizeText(description).split(' ');
  const out: InvoiceRef[] = [];
  let inList = false;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!;
    const glued = /^(?:FATTURA|FATT|FAT|FT|FV|NR|RIF|N)+(\d.*)$/.exec(tok);
    if (glued) {
      out.push(...numberTokenRefs(glued[1]!));
      inList = true;
      continue;
    }
    if (REF_KEYWORDS.has(tok)) {
      inList = true;
      continue;
    }
    if (LIST_STOPPERS.has(tok)) {
      inList = false;
      i++; // skip the date or amount that follows
      continue;
    }
    const refs = numberTokenRefs(tok);
    if (refs.length && (inList || /[/\-]/.test(tok))) {
      // Outside a keyword list only "2025/118"-style tokens count, and "03/2025" is a month, not an invoice.
      if (inList || (refs.some((r) => r.year) && !/^(0[1-9]|1[0-2])[/\-]20\d{2}$/.test(tok))) out.push(...refs);
      continue;
    }
    if (inList && LIST_JOINERS.has(tok)) continue;
    inList = false;
  }
  const seen = new Set<string>();
  return out.filter((r) => {
    const key = `${r.n}|${r.year ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const parsedNumbers = new Map<string, InvoiceRef | null>();

export function refMatchesNumber(ref: InvoiceRef, invoiceNumber: string): boolean {
  let parsed = parsedNumbers.get(invoiceNumber);
  if (parsed === undefined) {
    parsed = parseInvoiceNumber(invoiceNumber);
    if (parsedNumbers.size > 50_000) parsedNumbers.clear();
    parsedNumbers.set(invoiceNumber, parsed);
  }
  if (!parsed) return false;
  return parsed.n === ref.n && (!ref.year || !parsed.year || ref.year === parsed.year);
}

const euro = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
export const formatEuro = (cents: Cents) => euro.format(cents / 100);

export const toCents = (euros: number): Cents => Math.round(euros * 100);

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
