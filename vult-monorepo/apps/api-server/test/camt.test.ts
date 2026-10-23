import { describe, expect, it } from 'vitest';
import { parseCamt } from '../src/bank/camt.js';

// Fictional statement: names and IBANs are made up.
const statement = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">
  <BkToCstmrStmt>
    <GrpHdr><MsgId>STMT-1</MsgId><CreDtTm>2025-03-04T06:00:00</CreDtTm></GrpHdr>
    <Stmt>
      <Id>1</Id>
      <Acct><Id><IBAN>IT00X0000000000000000000909</IBAN></Id></Acct>
      <Ntry>
        <Amt Ccy="EUR">3050.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><Sts><Cd>BOOK</Cd></Sts>
        <BookgDt><Dt>2025-03-03</Dt></BookgDt><AcctSvcrRef>REF-1</AcctSvcrRef>
        <NtryDtls><TxDtls>
          <RltdPties><Dbtr><Pty><Nm>PASTIFICIO AURORA SRL</Nm></Pty></Dbtr><DbtrAcct><Id><IBAN>IT00 X000 0000 0000 0000 0000 001</IBAN></Id></DbtrAcct></RltdPties>
          <RmtInf><Ustrd>SALDO FT 2025/118</Ustrd></RmtInf>
        </TxDtls></NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="EUR">1710.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><Sts>BOOK</Sts>
        <BookgDt><Dt>2025-03-03</Dt></BookgDt><AcctSvcrRef>REF-2</AcctSvcrRef>
        <AddtlNtryInf>ACCREDITO BONIFICI CUMULATIVI</AddtlNtryInf>
        <NtryDtls>
          <TxDtls><Amt Ccy="EUR">1100.00</Amt><RltdPties><Dbtr><Nm>OFFICINE BRENTA SPA</Nm></Dbtr></RltdPties><RmtInf><Ustrd>FT 301</Ustrd></RmtInf></TxDtls>
          <TxDtls><AmtDtls><TxAmt><Amt Ccy="EUR">610.00</Amt></TxAmt></AmtDtls><RltdPties><Dbtr><Nm>STUDIO LUCE SNC</Nm></Dbtr></RltdPties><RmtInf><Strd><CdtrRefInf><Ref>RF18000000000000000000012</Ref></CdtrRefInf></Strd></RmtInf></TxDtls>
        </NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="EUR">120.40</Amt><CdtDbtInd>DBIT</CdtDbtInd><Sts>BOOK</Sts>
        <BookgDt><Dt>2025-03-04</Dt></BookgDt>
        <NtryDtls><TxDtls><RltdPties><Cdtr><Nm>ENEL ENERGIA</Nm></Cdtr></RltdPties></TxDtls></NtryDtls>
        <AddtlNtryInf>ADDEBITO SDD</AddtlNtryInf>
      </Ntry>
      <Ntry>
        <Amt Ccy="EUR">99.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><Sts>PDNG</Sts><BookgDt><Dt>2025-03-04</Dt></BookgDt>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

describe('parseCamt', () => {
  it('reads booked entries, payers, IBANs and remittance text', async () => {
    const txs = await parseCamt(statement);
    expect(txs).toHaveLength(4);
    expect(txs[0]).toMatchObject({ date: '2025-03-03', amount: 305_000, counterpartyName: 'PASTIFICIO AURORA SRL', counterpartyIban: 'IT00X0000000000000000000001', description: 'SALDO FT 2025/118' });
    expect(txs[1]).toMatchObject({ amount: 110_000, counterpartyName: 'OFFICINE BRENTA SPA', description: 'FT 301' });
    expect(txs[2]).toMatchObject({ amount: 61_000, counterpartyName: 'STUDIO LUCE SNC', description: 'RF18000000000000000000012' });
    expect(txs[3]).toMatchObject({ amount: -12_040, counterpartyName: 'ENEL ENERGIA', description: 'ADDEBITO SDD' });
    expect(new Set(txs.map((t) => t.id)).size).toBe(4);
  });

  it('gives the same ids when the same statement is imported twice', async () => {
    expect((await parseCamt(statement)).map((t) => t.id)).toEqual((await parseCamt(statement)).map((t) => t.id));
  });

  it('rejects other documents and entity declarations', async () => {
    await expect(parseCamt('<Document><Other/></Document>')).rejects.toThrow(/camt/);
    await expect(parseCamt('<!DOCTYPE d [<!ENTITY x "y">]><Document/>')).rejects.toThrow(/DTD/);
  });
});
