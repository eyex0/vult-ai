import { describe, expect, it } from 'vitest';
import { emptyMemory, learn, reconcile, summarizeCustomers, type BankTransaction, type OpenItem } from '../src/index.js';

// All companies, VAT numbers and IBANs below are fictional.
const AURORA = { customerVat: '00000000101', customerName: 'Pastificio Aurora S.r.l.' };
const BRENTA = { customerVat: '00000000202', customerName: 'Officine Brenta S.p.A.' };
const LUCE = { customerVat: '00000000303', customerName: 'Studio Luce S.n.c.' };

let seq = 0;
function inv(c: typeof AURORA, number: string, amount: number, dueDate: string, extra: Partial<OpenItem> = {}): OpenItem {
  seq++;
  return {
    id: `i${seq}`,
    invoiceId: `inv-${number}`,
    invoiceNumber: number,
    invoiceDate: '2025-01-15',
    ...c,
    kind: 'invoice',
    amount,
    dueDate,
    method: 'transfer',
    ...extra,
  };
}
function tx(amount: number, counterpartyName: string, description: string, extra: Partial<BankTransaction> = {}): BankTransaction {
  seq++;
  return { id: `t${seq}`, date: '2025-03-01', amount, counterpartyName, description, ...extra };
}

describe('reconcile', () => {
  it('auto-matches a known IBAN paying the exact amount', () => {
    const a = inv(AURORA, '2025/118', 305_000, '2025-02-28');
    const t = tx(305_000, 'PASTIFICIO AURORA', 'BONIFICO SALDO', { counterpartyIban: 'IT00 X000 0000 0000 0000 0000 001' });
    const memory = { ...emptyMemory(), ibans: { IT00X0000000000000000000001: AURORA.customerVat } };
    const [p] = reconcile({ items: [a], transactions: [t], memory }).proposals;
    expect(p!.status).toBe('auto');
    expect(p!.best!.allocations).toEqual([{ itemId: a.id, amount: 305_000 }]);
  });

  it('asks a person when only the name matches, then matches by itself after learning', () => {
    const a1 = inv(AURORA, '2025/118', 120_000, '2025-02-28');
    const a2 = inv(AURORA, '2025/131', 98_000, '2025-03-31');
    const t1 = tx(120_000, 'PASTIFICIO AURORA S', 'BONIFICO A VOSTRO FAVORE', { counterpartyIban: 'IT00X0000000000000000000001' });
    const first = reconcile({ items: [a1, a2], transactions: [t1] }).proposals[0]!;
    expect(first.status).toBe('review');
    expect(first.best!.allocations[0]!.itemId).toBe(a1.id);

    const { memory, lessons } = learn(emptyMemory(), t1, [a1]);
    expect(lessons[0]).toMatch(/IBAN ending 0001 belongs to Pastificio Aurora/);
    const t2 = tx(98_000, 'PASTIFICIO AURORA S', 'BONIFICO A VOSTRO FAVORE', { date: '2025-04-01', counterpartyIban: 'IT00X0000000000000000000001' });
    const second = reconcile({ items: [a1, a2], transactions: [t2], paid: { [a1.id]: 120_000 }, memory }).proposals[0]!;
    expect(second.status).toBe('auto');
    expect(second.best!.allocations[0]!.itemId).toBe(a2.id);
  });

  it('learns that a parent company pays for its subsidiary', () => {
    const a = inv(AURORA, '2025/140', 50_000, '2025-03-31');
    const b = inv(AURORA, '2025/150', 70_000, '2025-04-30');
    const t1 = tx(50_000, 'GRUPPO ALIMENTARE NORD HOLDING', 'PAGAMENTO FT 2025/140');
    const first = reconcile({ items: [a, b], transactions: [t1] }).proposals[0]!;
    expect(first.status).toBe('review');
    expect(first.best!.reasons.map((r) => r.code)).toContain('reference');

    const { memory, lessons } = learn(emptyMemory(), t1, [a]);
    expect(lessons).toContain('GRUPPO ALIMENTARE NORD HOLDING pays for Pastificio Aurora S.r.l.');
    const t2 = tx(70_000, 'GRUPPO ALIMENTARE NORD HOLDING', 'PAGAMENTO FT 2025/150');
    const second = reconcile({ items: [a, b], transactions: [t2], paid: { [a.id]: 50_000 }, memory }).proposals[0]!;
    expect(second.status).toBe('auto');
  });

  it('settles several invoices minus a credit note in one transfer', () => {
    const items = [
      inv(BRENTA, '301', 400_000, '2025-02-10'),
      inv(BRENTA, '302', 250_000, '2025-02-20'),
      inv(BRENTA, '305', 90_000, '2025-03-30'),
      inv(BRENTA, 'NC-7', 30_000, '2025-02-15', { kind: 'credit_note' }),
    ];
    const t = tx(620_000, 'OFFICINE BRENTA SPA', 'SALDO FT 301 302 NOSTRA NC 7');
    const p = reconcile({ items, transactions: [t] }).proposals[0]!;
    expect(p.status).toBe('auto');
    expect(p.best!.allocations).toEqual(
      expect.arrayContaining([
        { itemId: items[0]!.id, amount: 400_000 },
        { itemId: items[1]!.id, amount: 250_000 },
        { itemId: items[3]!.id, amount: -30_000 },
      ]),
    );
    expect(p.best!.reasons.map((r) => r.code)).toContain('credit_note');
  });

  it('explains a bank fee and a learned early-payment discount', () => {
    const a = inv(LUCE, '9', 100_000, '2025-02-28');
    const fee = reconcile({ items: [a], transactions: [tx(99_750, 'STUDIO LUCE SNC', 'FT 9')] }).proposals[0]!;
    expect(fee.best!.difference).toBe(-250);
    expect(fee.best!.reasons.find((r) => r.code === 'bank_fee')!.label).toBe('Bank fee €2.50');

    const b = inv(LUCE, '10', 500_000, '2025-03-31');
    const memory = { ...emptyMemory(), discounts: { [LUCE.customerVat]: 200 } };
    const disc = reconcile({ items: [b], transactions: [tx(490_000, 'STUDIO LUCE SNC', 'FT 10')], memory }).proposals[0]!;
    expect(disc.status).toBe('auto');
    expect(disc.best!.reasons.map((r) => r.label)).toContain('2% early-payment discount (learned)');
  });

  it('splits a Ri.Ba. batch credit across customers', () => {
    const r1 = inv(AURORA, '200', 110_000, '2025-03-31', { method: 'riba' });
    const r2 = inv(BRENTA, '410', 245_050, '2025-03-31', { method: 'riba' });
    const r3 = inv(LUCE, '12', 61_000, '2025-03-31', { method: 'riba' });
    const other = inv(LUCE, '13', 99_999, '2025-05-31', { method: 'riba' });
    const t = tx(416_050, 'BANCA DEL TERRITORIO', 'ACCREDITO DISTINTA RIBA SBF N 14', { date: '2025-03-25' });
    const p = reconcile({ items: [r1, r2, r3, other], transactions: [t] }).proposals[0]!;
    expect(p.status).toBe('auto');
    expect(p.best!.customerVat).toBeNull();
    expect(p.best!.allocations.map((a) => a.itemId).sort()).toEqual([r1.id, r2.id, r3.id].sort());
  });

  it('reopens an invoice when its Ri.Ba. comes back unpaid', () => {
    const r = inv(BRENTA, '410', 245_050, '2025-03-31', { method: 'riba' });
    const t = tx(-245_800, 'BANCA DEL TERRITORIO', 'INSOLUTO RIBA OFFICINE BRENTA SCAD 31/03/2025', { date: '2025-04-08' });
    const res = reconcile({ items: [r], transactions: [t], paid: { [r.id]: 245_050 } });
    const p = res.proposals[0]!;
    expect(p.kind).toBe('riba_return');
    expect(p.status).toBe('auto');
    expect(p.best!.allocations).toEqual([{ itemId: r.id, amount: -245_050 }]);
    expect(res.open[r.id]).toBe(245_050);
  });

  it('proposes a partial payment but never records it alone', () => {
    const a = inv(AURORA, '2025/160', 300_000, '2025-03-31');
    const t = tx(100_000, 'PASTIFICIO AURORA SRL', 'ACCONTO FT 2025/160');
    const p = reconcile({ items: [a], transactions: [t] }).proposals[0]!;
    expect(p.status).toBe('review');
    expect(p.best!.reasons.map((r) => r.code)).toContain('partial');
  });

  it('does not guess between two identical invoices without a reference', () => {
    const a = inv(AURORA, '1', 50_000, '2025-03-31');
    const b = inv(BRENTA, '2', 50_000, '2025-03-31');
    const p = reconcile({ items: [a, b], transactions: [tx(50_000, 'MARIO BIANCHI', 'BONIFICO')] }).proposals[0]!;
    expect(p.status).not.toBe('auto');
  });

  it('never lets two transfers claim the same invoice', () => {
    const a = inv(LUCE, '20', 80_000, '2025-02-28');
    const b = inv(LUCE, '21', 80_000, '2025-03-31');
    const memory = { ...emptyMemory(), ibans: { IT00X0000000000000000000003: LUCE.customerVat } };
    const iban = { counterpartyIban: 'IT00X0000000000000000000003' };
    const res = reconcile({ items: [a, b], transactions: [tx(80_000, 'STUDIO LUCE', 'FT 20', iban), tx(80_000, 'STUDIO LUCE', 'BONIFICO', iban)], memory });
    const used = res.proposals.filter((p) => p.status === 'auto').flatMap((p) => p.best!.allocations.map((x) => x.itemId));
    expect(new Set(used).size).toBe(used.length);
    expect(res.proposals[0]!.best!.allocations[0]!.itemId).toBe(a.id);
  });

  it('pairs equal installments with the payment closest to each due date', () => {
    const march = inv(AURORA, '2025/118', 122_000, '2025-03-31');
    const april = { ...inv(AURORA, '2025/118', 122_000, '2025-04-30'), invoiceId: march.invoiceId };
    const res = reconcile({
      items: [march, april],
      transactions: [tx(122_000, 'PASTIFICIO AURORA SRL', 'RATA', { date: '2025-04-30' }), tx(122_000, 'PASTIFICIO AURORA SRL', 'RATA', { date: '2025-03-31' })],
    });
    expect(res.proposals.map((p) => p.best!.allocations[0]!.itemId)).toEqual([april.id, march.id]);
    expect(res.proposals.every((p) => !p.best!.reasons.some((r) => r.code === 'ambiguous'))).toBe(true);
  });

  it('ignores ordinary outgoing payments', () => {
    const p = reconcile({ items: [], transactions: [tx(-12_000, 'ENEL ENERGIA', 'ADDEBITO SDD BOLLETTA')] }).proposals[0]!;
    expect(p.kind).toBe('outgoing');
    expect(p.status).toBe('unmatched');
  });

  it('stays fast with many customers', () => {
    const items: OpenItem[] = [];
    for (let c = 0; c < 2000; c++) {
      const cust = { customerVat: String(10_000_000_000 + c), customerName: `Cliente Numero${c} S.r.l.` };
      for (let k = 0; k < 5; k++) items.push(inv(cust, `${c}-${k}`, 10_000 + ((c * 37 + k * 101) % 90_000), '2025-03-31'));
    }
    const txs = Array.from({ length: 300 }, (_, i) => tx(items[i * 7]!.amount, `CLIENTE NUMERO${Math.floor((i * 7) / 5)}`, 'BONIFICO'));
    const start = performance.now();
    const res = reconcile({ items, transactions: txs });
    expect(performance.now() - start).toBeLessThan(2000);
    expect(res.proposals.filter((p) => p.status !== 'unmatched').length).toBeGreaterThan(250);
  });
});

describe('summarizeCustomers', () => {
  it('reports billed, collected, open, overdue and lateness', () => {
    const a = inv(AURORA, '1', 100_000, '2025-02-28');
    const b = inv(AURORA, '2', 50_000, '2025-03-15');
    const c = inv(AURORA, 'NC1', 10_000, '2025-03-01', { kind: 'credit_note' });
    const [row] = summarizeCustomers([a, b, c], [{ itemId: a.id, amount: 100_000, date: '2025-03-10' }], '2025-04-01');
    expect(row).toMatchObject({ billed: 140_000, collected: 100_000, open: 40_000, overdue: 50_000, avgDaysLate: 10, invoices: 2 });
  });
});
