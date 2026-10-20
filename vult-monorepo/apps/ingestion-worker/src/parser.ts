import { parseStringPromise } from 'xml2js';
import type { SdiInvoiceSummary } from '@vult/shared-types';

const MAX_XML_BYTES = 5 * 1024 * 1024;

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

export async function parseSdiXmlInvoice(xmlContent: string): Promise<SdiInvoiceSummary> {
  if (Buffer.byteLength(xmlContent, 'utf8') > MAX_XML_BYTES) {
    throw new Error('FatturaPA XML exceeds the 5 MiB limit');
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(xmlContent)) {
    throw new Error('DTD and entity declarations are not accepted');
  }

  try {
    const parsed: unknown = await parseStringPromise(xmlContent, {
      explicitArray: false,
      explicitRoot: true,
      explicitCharkey: false,
      trim: true,
      normalize: false,
      strict: true,
      xmlns: false
    });
    const rootName = parsed && typeof parsed === 'object' ? Object.keys(parsed as object)[0] : '';
    if (localName(rootName) !== 'FatturaElettronica') throw new Error('Unsupported XML root element');
    const root = findChild(parsed, rootName);
    const header = findChild(root, 'FatturaElettronicaHeader');
    const body = findChild(root, 'FatturaElettronicaBody');
    const recipient = findChild(header, 'CessionarioCommittente');
    const recipientData = findChild(recipient, 'DatiAnagrafici');
    const vatData = findChild(recipientData, 'IdFiscaleIVA');
    const person = findChild(recipientData, 'Anagrafica');
    const transmission = findChild(header, 'DatiTrasmissione');
    const general = findChild(body, 'DatiGenerali');
    const invoice = findChild(general, 'DatiGeneraliDocumento');
    const amountText = requiredText(findChild(invoice, 'ImportoTotaleDocumento'), 'ImportoTotaleDocumento');
    const invoiceAmount = Number(amountText);
    if (!Number.isFinite(invoiceAmount)) throw new Error('Invalid ImportoTotaleDocumento');

    const denomination = text(findChild(person, 'Denominazione'));
    const name = [text(findChild(person, 'Nome')), text(findChild(person, 'Cognome'))].filter(Boolean).join(' ');
    const vatNumber = text(findChild(vatData, 'IdCodice'));
    const taxCode = text(findChild(recipientData, 'CodiceFiscale')) || vatNumber;
    const companyName = denomination || name;

    return {
      vatNumber,
      taxCode,
      sdiCode: text(findChild(transmission, 'CodiceDestinatario')) || '0000000',
      companyName: requiredText(companyName, 'CessionarioCommittente.Anagrafica'),
      invoiceNumber: requiredText(findChild(invoice, 'Numero'), 'DatiGeneraliDocumento.Numero'),
      invoiceAmount,
      currency: text(findChild(invoice, 'Divisa')) || 'EUR'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown parser failure';
    throw new Error(`[SDI Parser Error] Invalid FatturaPA XML: ${message}`);
  }
}