const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_DEPTH = 32;

interface Header {
  universal: boolean;
  tag: number;
  constructed: boolean;
  /** Null for indefinite length (ends with two zero bytes). */
  length: number | null;
  contentStart: number;
}

function readHeader(buf: Buffer, pos: number, end: number): Header {
  if (pos + 2 > end) throw new Error('Truncated signature envelope');
  const first = buf[pos]!;
  let p = pos + 1;
  let tag = first & 0x1f;
  if (tag === 0x1f) {
    tag = 0;
    let b: number;
    do {
      if (p >= end) throw new Error('Truncated signature envelope');
      b = buf[p++]!;
      tag = tag * 128 + (b & 0x7f);
    } while (b & 0x80);
  }
  if (p >= end) throw new Error('Truncated signature envelope');
  const lenByte = buf[p++]!;
  let length: number | null;
  if (lenByte === 0x80) length = null;
  else if (lenByte & 0x80) {
    const n = lenByte & 0x7f;
    if (n > 4 || p + n > end) throw new Error('Invalid length in signature envelope');
    length = 0;
    for (let i = 0; i < n; i++) length = length * 256 + buf[p++]!;
  } else length = lenByte;
  if (length !== null && p + length > end) throw new Error('Signature envelope length overflows the file');
  return { universal: (first & 0xc0) === 0, tag, constructed: (first & 0x20) !== 0, length, contentStart: p };
}

const isEnd = (buf: Buffer, pos: number) => buf[pos] === 0 && buf[pos + 1] === 0;

/** Concatenated bytes of an OCTET STRING, which BER may split into chunks. Returns the position after it. */
function readOctets(buf: Buffer, h: Header, end: number, out: Buffer[], depth: number): number {
  if (depth > MAX_DEPTH) throw new Error('Signature envelope nested too deeply');
  if (!h.constructed) {
    out.push(buf.subarray(h.contentStart, h.contentStart + h.length!));
    return h.contentStart + h.length!;
  }
  let pos = h.contentStart;
  const stop = h.length === null ? end : h.contentStart + h.length;
  while (pos < stop) {
    if (h.length === null && isEnd(buf, pos)) return pos + 2;
    pos = readOctets(buf, readHeader(buf, pos, stop), stop, out, depth + 1);
  }
  return pos;
}

/** Walks the CMS structure and returns the first OCTET STRING that holds a FatturaPA document. */
function findInvoice(buf: Buffer, pos: number, end: number, depth: number): { xml: Buffer | null; next: number } {
  if (depth > MAX_DEPTH) throw new Error('Signature envelope nested too deeply');
  const h = readHeader(buf, pos, end);
  if (h.universal && h.tag === 4) {
    const parts: Buffer[] = [];
    const next = readOctets(buf, h, end, parts, depth);
    const content = Buffer.concat(parts);
    const head = content.subarray(0, 4096).toString('latin1');
    return { xml: /FatturaElettronica/.test(head) || /<\?xml/.test(head) ? content : null, next };
  }
  if (!h.constructed) return { xml: null, next: h.contentStart + h.length! };
  let p = h.contentStart;
  const stop = h.length === null ? end : h.contentStart + h.length;
  while (p < stop) {
    if (h.length === null && isEnd(buf, p)) return { xml: null, next: p + 2 };
    const found = findInvoice(buf, p, stop, depth + 1);
    if (found.xml) return found;
    p = found.next;
  }
  return { xml: null, next: p };
}

function decode(bytes: Buffer): string {
  const head = bytes.subarray(0, 200).toString('latin1');
  const text = /encoding=["'](ISO-8859-1|ISO-8859-15|windows-1252|latin1)["']/i.test(head) ? bytes.toString('latin1') : bytes.toString('utf8');
  return text.replace(/^﻿/, '');
}

/**
 * Invoices travel through SDI either as plain XML or signed (CAdES, ".xml.p7m"), sometimes base64-encoded.
 * Returns the invoice XML in every case.
 */
export function extractInvoiceXml(file: Buffer): string {
  if (file.length > MAX_INPUT_BYTES) throw new Error('Invoice file exceeds the 10 MiB limit');
  const start = file.subarray(0, 64).toString('latin1').replace(/^﻿/, '').trimStart();
  if (start.startsWith('<')) return decode(file);
  let der = file;
  if (/^MI[A-Za-z0-9+/]/.test(start)) der = Buffer.from(file.toString('latin1').replace(/[^A-Za-z0-9+/=]/g, ''), 'base64');
  const { xml } = findInvoice(der, 0, der.length, 0);
  if (!xml) throw new Error('No invoice found inside the signed file');
  return decode(xml);
}
