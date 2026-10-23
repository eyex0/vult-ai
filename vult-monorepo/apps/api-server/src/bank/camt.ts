import { createHash } from 'node:crypto';
import { parseStringPromise } from 'xml2js';
import type { BankTransaction } from '@vult/match';

const MAX_XML_BYTES = 10 * 1024 * 1024;

const localName = (key: string) => key.split(':').at(-1) ?? key;

function child(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  for (const [name, node] of Object.entries(value)) if (localName(name) === key) return node;
  return undefined;
}

function list(value: unknown, key: string): unknown[] {
  const node = child(value, key);
  if (node === undefined) return [];
  return Array.isArray(node) ? node : [node];
}

function path(value: unknown, ...keys: string[]): unknown {
  return keys.reduce<unknown>((node, key) => child(node, key), value);
}

function text(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (value && typeof value === 'object' && !Array.isArray(value) && '_' in value) return text((value as { _: unknown })._);
  return '';
}

function cents(value: unknown): number | null {
  const raw = text(value);
  if (!/^\d+(\.\d{1,5})?$/.test(raw)) return null;
  return Math.round(Number(raw) * 100);
}

/** Party name in camt.053 v2 (Dbtr/Nm) and v8+ (Dbtr/Pty/Nm). */
const partyName = (party: unknown) => text(child(party, 'Nm')) || text(path(party, 'Pty', 'Nm'));
const iban = (account: unknown) => text(path(account, 'Id', 'IBAN')).replace(/\s+/g, '').toUpperCase();

function remittance(node: unknown): string {
  const info = child(node, 'RmtInf');
  const unstructured = list(info, 'Ustrd').map(text);
  const structured = list(info, 'Strd').map((s) => text(path(s, 'CdtrRefInf', 'Ref')));
  return [...unstructured, ...structured].filter(Boolean).join(' ');
}

/**
 * Reads ISO 20022 bank statements: camt.053 (statement), camt.052 (intraday report) and camt.054 (notification).
 * An entry that lists each payment of a batch with its own amount becomes one transaction per payment.
 */
export async function parseCamt(xml: string): Promise<BankTransaction[]> {
  if (Buffer.byteLength(xml, 'utf8') > MAX_XML_BYTES) throw new Error('Statement exceeds the 10 MiB limit');
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('DTD and entity declarations are not accepted');
  const parsed: unknown = await parseStringPromise(xml, { explicitArray: false, explicitRoot: true, trim: true, strict: true, xmlns: false });
  const rootName = parsed && typeof parsed === 'object' ? Object.keys(parsed)[0] ?? '' : '';
  if (localName(rootName) !== 'Document') throw new Error('Not an ISO 20022 document');
  const doc = (parsed as Record<string, unknown>)[rootName];
  const message = child(doc, 'BkToCstmrStmt') ?? child(doc, 'BkToCstmrAcctRpt') ?? child(doc, 'BkToCstmrDbtCdtNtfctn');
  if (!message) throw new Error('Unsupported camt message: expected camt.052, camt.053 or camt.054');
  const sections = [...list(message, 'Stmt'), ...list(message, 'Rpt'), ...list(message, 'Ntfctn')];

  const out: BankTransaction[] = [];
  for (const section of sections) {
    const account = iban(child(section, 'Acct'));
    for (const entry of list(section, 'Ntry')) {
      const status = text(child(entry, 'Sts')) || text(path(entry, 'Sts', 'Cd'));
      if (status && status !== 'BOOK') continue; // pending and informational entries are not money yet
      const sign = text(child(entry, 'CdtDbtInd')) === 'DBIT' ? -1 : 1;
      const date = (text(path(entry, 'BookgDt', 'Dt')) || text(path(entry, 'BookgDt', 'DtTm')) || text(path(entry, 'ValDt', 'Dt'))).slice(0, 10);
      const total = cents(child(entry, 'Amt'));
      if (!date || total === null) continue;
      const ref = text(child(entry, 'AcctSvcrRef')) || text(child(entry, 'NtryRef'));
      const extra = text(child(entry, 'AddtlNtryInf'));
      const details = list(child(entry, 'NtryDtls'), 'TxDtls');
      const own = details.map((d) => cents(child(d, 'Amt')) ?? cents(path(d, 'AmtDtls', 'TxAmt', 'Amt')));
      const split = details.length > 1 && own.every((a) => a !== null);
      const rows = split ? details.map((d, i) => ({ d, amount: own[i]! })) : [{ d: details[0], amount: total }];
      rows.forEach(({ d, amount }, i) => {
        const parties = child(d, 'RltdPties');
        const incoming = sign > 0;
        const name = partyName(child(parties, incoming ? 'Dbtr' : 'Cdtr')) || partyName(child(parties, incoming ? 'UltmtDbtr' : 'UltmtCdtr'));
        const counterpartyIban = iban(child(parties, incoming ? 'DbtrAcct' : 'CdtrAcct'));
        const description = [remittance(d), split ? '' : extra].filter(Boolean).join(' ') || extra;
        const key = `${account}|${ref}|${date}|${amount}|${description}|${i}`;
        out.push({
          id: `camt-${createHash('sha256').update(key).digest('hex').slice(0, 24)}`,
          date,
          amount: sign * amount,
          counterpartyName: name,
          ...(counterpartyIban ? { counterpartyIban } : {}),
          description,
        });
      });
    }
  }
  return out;
}
