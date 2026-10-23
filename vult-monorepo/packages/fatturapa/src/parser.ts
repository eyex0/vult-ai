import { parseStringPromise } from 'xml2js';
import type { SdiInvoiceSummary, SdiPaymentInstallment, SdiPaymentMethod } from '@vult/shared-types';
import { extractInvoiceXml } from './p7m.js';

const MAX_XML_BYTES = 5 * 1024 * 1024;
const DEFAULT_TERMS_DAYS = 30;

function localName(key: string): string {
  return key.split(':').at(-1) ?? key;
}

function findChild(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  for (const [name, child] of Object.entries(value)) {
    if (localName(name) === key) return child;
  }
  return undefined;
}

/** Repeated elements come back as an array, single ones as an object: always get a list. */
function children(value: unknown, key: string): unknown[] {
  const child = findChild(value, key);
  if (child === undefined) return [];
  return Array.isArray(child) ? child : [child];
}

function text(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (value && typeof value === 'object' && !Array.isArray(value) && '_' in value) return text(value._);
  return '';
}

function requiredText(value: unknown, field: string): string {
  const result = text(value);
  if (!result) throw new Error(`Missing required FatturaPA field: ${field}`);
  return result;
}

function amount(value: unknown, field: string): number {
  const raw = text(value);
  if (!raw) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${field}`);
  return n;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function isoDate(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) throw new Error(`Invalid ${field}`);
  return value;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** FatturaPA ModalitaPagamento codes grouped by how the money arrives at the bank. */
export function paymentMethod(code: string): SdiPaymentMethod {
  if (code === 'MP12') return 'riba';
  if (code === 'MP05' || code === 'MP15') return 'transfer';
  if (['MP09', 'MP10', 'MP11', 'MP16', 'MP17', 'MP19', 'MP20', 'MP21'].includes(code)) return 'direct_debit';
  if (code === 'MP01' || code === 'MP04') return 'cash';
  if (code === 'MP08') return 'card';
  return 'other';
}

function party(node: unknown): { vatNumber: string; taxCode: string; name: string } {
  const data = findChild(node, 'DatiAnagrafici');
  const vatNumber = text(findChild(findChild(data, 'IdFiscaleIVA'), 'IdCodice'));
  const person = findChild(data, 'Anagrafica');
  const name = text(findChild(person, 'Denominazione')) || [text(findChild(person, 'Nome')), text(findChild(person, 'Cognome'))].filter(Boolean).join(' ');
  return { vatNumber, taxCode: text(findChild(data, 'CodiceFiscale')) || vatNumber, name };
}

function parseBody(header: unknown, body: unknown): SdiInvoiceSummary {
  const customer = party(findChild(header, 'CessionarioCommittente'));
  const seller = party(findChild(header, 'CedentePrestatore'));
  const transmission = findChild(header, 'DatiTrasmissione');
  const general = findChild(findChild(body, 'DatiGenerali'), 'DatiGeneraliDocumento');
  const summaries = children(findChild(body, 'DatiBeniServizi'), 'DatiRiepilogo');

  const documentType = text(findChild(general, 'TipoDocumento')) || 'TD01';
  const invoiceDate = isoDate(requiredText(findChild(general, 'Data'), 'DatiGeneraliDocumento.Data'), 'DatiGeneraliDocumento.Data');
  const taxAmount = round2(summaries.reduce<number>((s, r) => s + amount(findChild(r, 'Imposta'), 'Imposta'), 0));
  const taxable = summaries.reduce<number>((s, r) => s + amount(findChild(r, 'ImponibileImporto'), 'ImponibileImporto'), 0);
  // ImportoTotaleDocumento is optional in FatturaPA; fall back to taxable + VAT.
  const totalText = text(findChild(general, 'ImportoTotaleDocumento'));
  const invoiceAmount = totalText ? amount(totalText, 'ImportoTotaleDocumento') : round2(taxable + taxAmount);
  if (!totalText && !summaries.length) throw new Error('Missing ImportoTotaleDocumento and DatiRiepilogo');
  const withholdingAmount = round2(children(general, 'DatiRitenuta').reduce<number>((s, r) => s + amount(findChild(r, 'ImportoRitenuta'), 'ImportoRitenuta'), 0));
  const splitPayment = summaries.some((r) => text(findChild(r, 'EsigibilitaIVA')) === 'S');

  let installmentsEstimated = false;
  const installments: SdiPaymentInstallment[] = [];
  for (const block of children(body, 'DatiPagamento')) {
    for (const detail of children(block, 'DettaglioPagamento')) {
      const methodCode = text(findChild(detail, 'ModalitaPagamento')) || 'MP05';
      let dueDate = text(findChild(detail, 'DataScadenzaPagamento'));
      if (!dueDate) {
        const from = text(findChild(detail, 'DataRiferimentoTerminiPagamento')) || invoiceDate;
        const days = Number(text(findChild(detail, 'GiorniTerminiPagamento')) || DEFAULT_TERMS_DAYS);
        dueDate = addDays(isoDate(from, 'DataRiferimentoTerminiPagamento'), Number.isFinite(days) ? days : DEFAULT_TERMS_DAYS);
        installmentsEstimated = true;
      }
      const iban = text(findChild(detail, 'IBAN')).replace(/\s+/g, '').toUpperCase();
      installments.push({
        dueDate: isoDate(dueDate, 'DataScadenzaPagamento'),
        amount: amount(findChild(detail, 'ImportoPagamento'), 'ImportoPagamento'),
        methodCode,
        method: paymentMethod(methodCode),
        ...(iban ? { iban } : {}),
      });
    }
  }
  if (!installments.length) {
    // No payment details: the customer owes the total, minus withholding and split-payment VAT, in 30 days.
    installmentsEstimated = true;
    installments.push({
      dueDate: addDays(invoiceDate, DEFAULT_TERMS_DAYS),
      amount: round2(invoiceAmount - withholdingAmount - (splitPayment ? taxAmount : 0)),
      methodCode: 'MP05',
      method: 'transfer',
    });
  }

  return {
    vatNumber: customer.vatNumber,
    taxCode: customer.taxCode,
    sdiCode: text(findChild(transmission, 'CodiceDestinatario')) || '0000000',
    companyName: requiredText(customer.name, 'CessionarioCommittente.Anagrafica'),
    invoiceNumber: requiredText(findChild(general, 'Numero'), 'DatiGeneraliDocumento.Numero'),
    invoiceAmount,
    currency: text(findChild(general, 'Divisa')) || 'EUR',
    documentType,
    kind: documentType === 'TD04' ? 'credit_note' : 'invoice',
    invoiceDate,
    seller: { vatNumber: seller.vatNumber, name: seller.name },
    taxAmount,
    withholdingAmount,
    splitPayment,
    installments,
    installmentsEstimated,
  };
}

/** Every invoice in a FatturaPA file (a file may carry a batch, one FatturaElettronicaBody each). Accepts plain XML or a signed .p7m. */
export async function parseSdiXmlInvoices(content: string | Buffer): Promise<SdiInvoiceSummary[]> {
  try {
    const xmlContent = typeof content === 'string' ? content : extractInvoiceXml(content);
    if (Buffer.byteLength(xmlContent, 'utf8') > MAX_XML_BYTES) {
      throw new Error('FatturaPA XML exceeds the 5 MiB limit');
    }
    if (/<!DOCTYPE|<!ENTITY/i.test(xmlContent)) {
      throw new Error('DTD and entity declarations are not accepted');
    }
    const parsed: unknown = await parseStringPromise(xmlContent, {
      explicitArray: false,
      explicitRoot: true,
      explicitCharkey: false,
      trim: true,
      normalize: false,
      strict: true,
      xmlns: false
    });
    const rootName = parsed && typeof parsed === 'object' ? Object.keys(parsed as object)[0] ?? '' : '';
    if (localName(rootName) !== 'FatturaElettronica') throw new Error('Unsupported XML root element');
    // The root usually carries a namespace prefix ("p:FatturaElettronica"), so look it up by its full name.
    const root = (parsed as Record<string, unknown>)[rootName];
    const header = findChild(root, 'FatturaElettronicaHeader');
    const bodies = children(root, 'FatturaElettronicaBody');
    if (!bodies.length) throw new Error('Missing FatturaElettronicaBody');
    return bodies.map((body) => parseBody(header, body));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown parser failure';
    throw new Error(`[SDI Parser Error] Invalid FatturaPA XML: ${message}`);
  }
}

/** The first invoice of a FatturaPA file. */
export async function parseSdiXmlInvoice(content: string | Buffer): Promise<SdiInvoiceSummary> {
  const [first] = await parseSdiXmlInvoices(content);
  return first!;
}
