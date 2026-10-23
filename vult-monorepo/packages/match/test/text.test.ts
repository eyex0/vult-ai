import { describe, expect, it } from 'vitest';
import { extractReferences, nameSimilarity, normalizeName, parseInvoiceNumber } from '../src/index.js';
import { taxIdsInText } from '../src/text.js';

describe('extractReferences', () => {
  const refs = (s: string) => extractReferences(s).map((r) => (r.year ? `${r.n}/${r.year}` : r.n));

  it('reads invoice numbers after keywords', () => {
    expect(refs('SALDO FT 118')).toEqual(['118']);
    expect(refs('PAGAMENTO FATT. N. 2025/118 DEL 12/03/2025')).toEqual(['118/2025']);
    expect(refs('RIF FT 118-119 E 121')).toEqual(['118', '119', '121']);
    expect(refs('FT.45/25 SALDO')).toEqual(['45/2025']);
    expect(refs('FATTN118/2025')).toEqual(['118/2025']);
  });

  it('ignores amounts, dates and months', () => {
    expect(refs('BONIFICO 3.050,00 EUR 12/03/2025')).toEqual([]);
    expect(refs('COMPETENZE 03/2025')).toEqual([]);
    expect(refs('FATTURA 120 DEL 12/03/2025 IMPORTO 3050')).toEqual(['120']);
  });

  it('accepts year/number tokens without a keyword', () => {
    expect(refs('ACCONTO ORDINE CLIENTE 2025/118')).toEqual(['118/2025']);
  });
});

describe('parseInvoiceNumber', () => {
  it('normalizes common Italian numbering', () => {
    expect(parseInvoiceNumber('2025/118')).toEqual({ n: '118', year: '2025' });
    expect(parseInvoiceNumber('118/2025')).toEqual({ n: '118', year: '2025' });
    expect(parseInvoiceNumber('FV-00118')).toEqual({ n: '118' });
    expect(parseInvoiceNumber('A/118')).toEqual({ n: '118' });
  });
});

describe('names', () => {
  it('drops legal forms and tolerates truncation', () => {
    expect(normalizeName('Pastificio Aurora S.r.l. Unipersonale')).toBe('PASTIFICIO AURORA');
    expect(nameSimilarity('PASTIFICIO AURORA S', 'Pastificio Aurora S.r.l.')).toBe(1);
    expect(nameSimilarity('PASTIFICO AURORA SRL', 'Pastificio Aurora S.r.l.')).toBe(1);
    expect(nameSimilarity('Officine Brenta SpA', 'Pastificio Aurora S.r.l.')).toBe(0);
  });

  it('finds VAT numbers and tax codes in text', () => {
    expect(taxIdsInText('ORD. P.IVA IT00000000101 SALDO')).toEqual(['00000000101']);
    expect(taxIdsInText('CF RSSMRA80A01H501U')).toEqual(['RSSMRA80A01H501U']);
  });
});
