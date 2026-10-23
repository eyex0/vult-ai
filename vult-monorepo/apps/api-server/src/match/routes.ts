import express, { Router, type Response } from 'express';
import { z } from 'zod';
import { withTenantContext } from '@vult/database';
import { parseInvoiceArchive, parseSdiXmlInvoices, saveSdiInvoices } from '@vult/fatturapa';
import { parseBankCsv } from '@vult/match';
import { parseCamt } from '../bank/camt.js';
import { asyncRoute } from '../http.js';
import { requireWriteAccess } from '../middleware/tenantIsolation.js';
import { confirmMatch, ignoreTransaction, unmatchTransaction, importTransactions, listTransactions, MatchError, receivables, runMatching } from './service.js';

/** Matching runs can touch thousands of rows: give their transactions more than Prisma's 5 s default. */
const LONG = { timeout: 120_000, maxWait: 10_000 };
const statementBody = express.raw({ type: () => true, limit: '10mb' });
const invoiceBody = express.raw({ type: () => true, limit: '50mb' });
const uuid = z.string().uuid();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function fail(res: Response, error: unknown) {
  if (error instanceof MatchError) return void res.status(error.status).json({ error: error.message });
  throw error;
}

const isXml = (buf: Buffer) => buf.subarray(0, 512).toString('latin1').replace(/^﻿/, '').trimStart().startsWith('<');
const isZip = (buf: Buffer) => buf[0] === 0x50 && buf[1] === 0x4b;

export function matchRouter(): Router {
  const r = Router();

  /** Upload a bank statement: camt.052/053/054 XML or a CSV export. Importing the same file twice adds nothing. */
  r.post('/bank/statements', requireWriteAccess, statementBody, asyncRoute(async (req, res) => {
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!body.length) return void res.status(400).json({ error: 'Send the statement file as the request body' });
    let transactions;
    let skipped: { row: number; reason: string }[] = [];
    try {
      if (isXml(body)) transactions = await parseCamt(body.toString('utf8'));
      else ({ transactions, skipped } = parseBankCsv(body.toString('utf8')));
    } catch (error) {
      return void res.status(400).json({ error: error instanceof Error ? error.message : 'Unreadable statement' });
    }
    if (!transactions.length) return void res.status(400).json({ error: 'No transactions found', skipped });
    const result = await withTenantContext(req.tenant.tenantId, (tx) => importTransactions(tx, req.tenant.tenantId, transactions), LONG);
    res.status(201).json({ success: true, ...result, skipped });
  }));

  /** Upload invoices: one FatturaPA XML, a signed .p7m, or the ZIP downloaded from the Agenzia delle Entrate portal. */
  r.post('/invoices/import', requireWriteAccess, invoiceBody, asyncRoute(async (req, res) => {
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!body.length) return void res.status(400).json({ error: 'Send the invoice file as the request body' });
    let invoices;
    let skipped: { fileName: string; reason: string }[] = [];
    try {
      if (isZip(body)) ({ invoices, skipped } = await parseInvoiceArchive(body));
      else invoices = await parseSdiXmlInvoices(body);
    } catch (error) {
      return void res.status(400).json({ error: error instanceof Error ? error.message : 'Unreadable invoice file' });
    }
    const result = await withTenantContext(req.tenant.tenantId, async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: req.tenant.tenantId }, select: { vatNumber: true } });
      return saveSdiInvoices(tx, req.tenant.tenantId, invoices, { tenantVat: tenant?.vatNumber });
    }, LONG);
    res.status(201).json({ success: true, ...result, skipped });
  }));

  r.post('/match/run', requireWriteAccess, asyncRoute(async (req, res) => {
    const today = day.optional().safeParse(req.body?.today);
    const summary = await withTenantContext(req.tenant.tenantId, (tx) => runMatching(tx, req.tenant.tenantId, today.success ? today.data : undefined), LONG);
    res.json({ success: true, ...summary });
  }));

  r.get('/match/transactions', asyncRoute(async (req, res) => {
    const status = z.enum(['UNMATCHED', 'SUGGESTED', 'MATCHED', 'IGNORED']).optional().safeParse(req.query.status);
    if (!status.success) return void res.status(400).json({ error: 'Invalid status' });
    const data = await withTenantContext(req.tenant.tenantId, (tx) => listTransactions(tx, req.tenant.tenantId, status.data));
    res.json({ success: true, ...data });
  }));

  r.post('/match/transactions/:id/confirm', requireWriteAccess, asyncRoute(async (req, res) => {
    const id = uuid.safeParse(req.params.id);
    const body = z.object({
      allocations: z.array(z.object({ installmentId: uuid, amountCents: z.number().int().refine((n) => n !== 0) })).min(1).max(100),
      today: day.optional(),
    }).safeParse(req.body);
    if (!id.success || !body.success) return void res.status(400).json({ error: 'Invalid confirmation', details: body.success ? undefined : body.error.flatten() });
    try {
      const result = await withTenantContext(
        req.tenant.tenantId,
        (tx) => confirmMatch(tx, req.tenant.tenantId, req.tenant.userId, id.data, body.data, body.data.today),
        LONG,
      );
      res.json({ success: true, ...result });
    } catch (error) {
      fail(res, error);
    }
  }));

  r.post('/match/transactions/:id/unmatch', requireWriteAccess, asyncRoute(async (req, res) => {
    const id = uuid.safeParse(req.params.id);
    if (!id.success) return void res.status(400).json({ error: 'Invalid id' });
    try {
      await withTenantContext(req.tenant.tenantId, (tx) => unmatchTransaction(tx, req.tenant.tenantId, id.data));
      res.json({ success: true });
    } catch (error) {
      fail(res, error);
    }
  }));

  r.post('/match/transactions/:id/ignore', requireWriteAccess, asyncRoute(async (req, res) => {
    const id = uuid.safeParse(req.params.id);
    if (!id.success) return void res.status(400).json({ error: 'Invalid id' });
    try {
      await withTenantContext(req.tenant.tenantId, (tx) => ignoreTransaction(tx, req.tenant.tenantId, id.data));
      res.json({ success: true });
    } catch (error) {
      fail(res, error);
    }
  }));

  r.get('/receivables', asyncRoute(async (req, res) => {
    const vat = z.string().max(32).optional().safeParse(req.query.vat);
    const today = day.optional().safeParse(req.query.today);
    if (!vat.success || !today.success) return void res.status(400).json({ error: 'Invalid query' });
    const data = await withTenantContext(req.tenant.tenantId, (tx) => receivables(tx, req.tenant.tenantId, today.data, vat.data));
    res.json({ success: true, data });
  }));

  return r;
}

