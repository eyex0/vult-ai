import { describe, expect, it } from 'vitest';
import { counterpartyFromText, parseAmount, parseBankCsv, parseDate } from '../src/index.js';

describe('parseAmount', () => {
  it.each([
    ['1.234,56', 123_456],
    ['-1.234,56', -123_456],
    ['1,234.56', 123_456],
    ['€ 1234.5', 123_450],
    ['1.234', 123_400],
    ['(45,00)', -4_500],
    ['250,00-', -25_000],
    ['abc', null],
  ])('%s', (raw, cents) => expect(parseAmount(raw)).toBe(cents));
});

describe('parseDate', () => {
  it.each([
    ['31/12/2025', '2025-12-31'],
    ['1-3-25', '2025-03-01'],
    ['31.12.2025', '2025-12-31'],
    ['2025-12-31', '2025-12-31'],
    ['32/01/2025', null],
  ])('%s', (raw, iso) => expect(parseDate(raw)).toBe(iso));
});

describe('parseBankCsv', () => {
  it('reads an Italian home-banking export with separate credit and debit columns', () => {
    const csv = [
      'Estratto conto;;;;',
      'Data contabile;Data valuta;Descrizione;Entrate;Uscite',
      '03/03/2025;03/03/2025;"BONIFICO DA PASTIFICIO AURORA SRL PER SALDO FT 118";"3.050,00";',
      '04/03/2025;04/03/2025;ADDEBITO SDD ENEL;;"120,40"',
      'xx;;;;',
    ].join('\n');
    const { transactions, skipped } = parseBankCsv(csv);
    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({ date: '2025-03-03', amount: 305_000, counterpartyName: 'PASTIFICIO AURORA SRL' });
    expect(transactions[1]!.amount).toBe(-12_040);
    expect(skipped).toEqual([{ row: 5, reason: 'Unreadable date' }]);
  });

  it('reads an English export with one signed amount column', () => {
    const csv = 'Date,Amount,Counterparty,Counterparty IBAN,Description\n2025-03-03,1250.00,Officine Brenta SpA,IT00 X000,"Invoice 301, 302"\n';
    const { transactions } = parseBankCsv(csv);
    expect(transactions[0]).toMatchObject({ amount: 125_000, counterpartyName: 'Officine Brenta SpA', counterpartyIban: 'IT00X000', description: 'Invoice 301, 302' });
  });

  it('pulls the payer name out of a description', () => {
    expect(counterpartyFromText('BONIFICO SEPA DA STUDIO LUCE SNC PER FT 9')).toBe('STUDIO LUCE SNC');
    expect(counterpartyFromText('ADDEBITO SDD')).toBe('');
  });
});
