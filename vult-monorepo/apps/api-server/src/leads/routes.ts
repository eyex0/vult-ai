import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '@vult/database';
import { config } from '../config.js';
import { asyncRoute } from '../http.js';
import { errorFields, log } from '../log.js';

const input = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  company: z.string().trim().min(1).max(160),
  role: z.string().trim().max(80).optional(),
  invoicesPerMonth: z.enum(['<50', '50-200', '200-1000', '>1000']).optional(),
  message: z.string().trim().max(2000).optional(),
  language: z.enum(['en', 'it']).default('en'),
  source: z.string().trim().max(120).optional(),
  /** Honeypot: people never see this field, bots fill it in. */
  website: z.string().max(0).optional(),
});

/** Public: anyone can ask for early access. Stored, and optionally forwarded to a webhook (Slack, Make, Zapier). */
export function leadsRouter(): Router {
  const r = Router();
  const limiter = rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests, try again later' } });

  r.post('/', limiter, asyncRoute(async (req, res) => {
    const body = input.safeParse(req.body);
    if (!body.success) return void res.status(400).json({ error: 'Check the highlighted fields', fields: body.error.flatten().fieldErrors });
    const { website: _honeypot, ...data } = body.data;
    const lead = await prisma.lead.create({ data, select: { id: true, createdAt: true } });
    log('info', 'early access request', { lead: lead.id, invoicesPerMonth: data.invoicesPerMonth, language: data.language });
    const hook = config().LEADS_WEBHOOK_URL;
    if (hook) {
      // Fire and forget: a slow or broken webhook never fails the visitor's request.
      void fetch(hook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: `New Vult early access request: ${data.name} (${data.company}) <${data.email}>, invoices/month ${data.invoicesPerMonth ?? 'n/a'}`, lead: { ...data, id: lead.id } }),
        signal: AbortSignal.timeout(5_000),
      }).catch((error: unknown) => log('warn', 'lead webhook failed', errorFields(error)));
    }
    res.status(201).json({ success: true });
  }));

  return r;
}
