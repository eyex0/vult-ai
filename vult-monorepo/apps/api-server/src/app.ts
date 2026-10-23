import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { prisma, withTenantContext, type Prisma } from '@vult/database';
import { authRouter } from './auth/routes.js';
import { leadsRouter } from './leads/routes.js';
import { CSRF_HEADER } from './auth/session.js';
import { config } from './config.js';
import { asyncRoute } from './http.js';
import { errorFields, log } from './log.js';
import { matchRouter } from './match/routes.js';
import {
  requireWriteAccess,
  tenantIsolationMiddleware,
} from './middleware/tenantIsolation.js';

export const app = express();
const cfg = config();
const recordInput = z.object({
  objectSlug: z.string().min(1).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/),
  attributes: z.record(z.unknown())
});

app.disable('x-powered-by');
app.set('trust proxy', cfg.TRUST_PROXY_HOPS);
app.use(helmet());
app.use(cors({
  origin: cfg.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', CSRF_HEADER, 'X-Request-Id'],
  maxAge: 600
}));

// Request id for tracing across services, and one log line per request (never bodies or tokens).
app.use((req, res, next) => {
  const incoming = req.header('x-request-id');
  const id = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
  res.setHeader('x-request-id', id);
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    if (req.path === '/health') return;
    log(res.statusCode >= 500 ? 'error' : 'info', 'request', {
      id,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      ms: Number((process.hrtime.bigint() - start) / 1_000_000n),
      tenant: req.tenant?.tenantId
    });
  });
  next();
});

app.use(express.json({ limit: cfg.JSON_BODY_LIMIT }));
/** Liveness: the process is up. */
app.get('/health', (_req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));
/** Readiness: the database answers, so the load balancer can send traffic. */
app.get('/ready', asyncRoute(async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'database unavailable' });
  }
}));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/v1/auth', authRouter());
app.use('/api/v1/leads', leadsRouter());
app.use('/api', tenantIsolationMiddleware);

app.get('/api/v1/objects', asyncRoute(async (req, res) => {
  const data = await withTenantContext(req.tenant.tenantId, (tx) => tx.objectType.findMany({
    where: { tenantId: req.tenant.tenantId },
    include: { attributes: { orderBy: { createdAt: 'asc' } } },
    orderBy: { name: 'asc' }
  }));
  res.json({ success: true, data });
}));

app.post('/api/v1/records', requireWriteAccess, asyncRoute(async (req, res) => {
  const parsed = recordInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid record payload', details: parsed.error.flatten() });
    return;
  }

  const result = await withTenantContext(req.tenant.tenantId, async (tx) => {
    const objectType = await tx.objectType.findFirst({
      where: { tenantId: req.tenant.tenantId, slug: parsed.data.objectSlug },
      include: { attributes: true }
    });
    if (!objectType) return null;

    const allowed = new Set(objectType.attributes.map((attribute) => attribute.slug));
    const unknownAttributes = Object.keys(parsed.data.attributes).filter((key) => !allowed.has(key));
    if (unknownAttributes.length) return { error: 'Unknown attributes', unknownAttributes } as const;

    const values: Prisma.AttributeValueUncheckedCreateWithoutRecordInput[] = [];
    for (const attribute of objectType.attributes) {
      const value = parsed.data.attributes[attribute.slug];
      if (value === undefined || value === null) {
        if (attribute.isRequired) return { error: 'Required attribute missing', attribute: attribute.slug } as const;
        continue;
      }
      // objectTypeId is derived from the parent record in this nested create.
      const entry: Prisma.AttributeValueUncheckedCreateWithoutRecordInput = {
        tenantId: req.tenant.tenantId,
        attributeId: attribute.id
      };

      switch (attribute.dataType) {
        case 'TEXT':
        case 'STATUS':
          if (typeof value !== 'string') return { error: 'Expected text', attribute: attribute.slug } as const;
          entry.textValue = value;
          break;
        case 'NUMBER':
          if (typeof value !== 'number' || !Number.isFinite(value)) return { error: 'Expected finite number', attribute: attribute.slug } as const;
          entry.numberValue = value;
          break;
        case 'CURRENCY':
          if (typeof value !== 'number' || !Number.isFinite(value)) return { error: 'Expected finite currency value', attribute: attribute.slug } as const;
          entry.decimalValue = value.toFixed(4);
          break;
        case 'BOOLEAN':
          if (typeof value !== 'boolean') return { error: 'Expected boolean', attribute: attribute.slug } as const;
          entry.booleanValue = value;
          break;
        case 'DATE': {
          if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) return { error: 'Expected ISO date', attribute: attribute.slug } as const;
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return { error: 'Invalid date', attribute: attribute.slug } as const;
          entry.dateValue = date;
          break;
        }
        case 'USER_REF':
        case 'OBJECT_REF':
          entry.jsonValue = { id: value };
          break;
      }
      values.push(entry);
    }

    const record = await tx.record.create({
      data: {
        tenantId: req.tenant.tenantId,
        objectTypeId: objectType.id,
        values: { create: values }
      },
      select: { id: true }
    });
    return { id: record.id };
  });

  if (!result) {
    res.status(404).json({ error: `Object type '${parsed.data.objectSlug}' not found` });
    return;
  }
  if ('error' in result) {
    res.status(400).json(result);
    return;
  }
  res.status(201).json({ success: true, recordId: result.id });
}));

app.get('/api/v1/records/:objectSlug', asyncRoute(async (req, res) => {
  const objectSlug = z.string().min(1).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/).safeParse(req.params.objectSlug);
  if (!objectSlug.success) {
    res.status(400).json({ error: 'Invalid object slug' });
    return;
  }

  const result = await withTenantContext(req.tenant.tenantId, async (tx) => {
    const objectType = await tx.objectType.findFirst({
      where: { tenantId: req.tenant.tenantId, slug: objectSlug.data },
      include: { attributes: true }
    });
    if (!objectType) return null;
    const records = await tx.record.findMany({
      where: { tenantId: req.tenant.tenantId, objectTypeId: objectType.id },
      include: { values: true },
      orderBy: { updatedAt: 'desc' },
      take: 500
    });
    const attributes = new Map(objectType.attributes.map((attribute) => [attribute.id, attribute.slug]));
    const data = records.map((record) => {
      const flattened: Record<string, unknown> = { id: record.id, createdAt: record.createdAt, updatedAt: record.updatedAt };
      for (const value of record.values) {
        const slug = attributes.get(value.attributeId);
        if (!slug) continue;
        flattened[slug] = value.textValue ?? value.numberValue ?? value.decimalValue?.toString() ?? value.booleanValue ?? value.dateValue ?? value.jsonValue;
      }
      return flattened;
    });
    return { objectType: { id: objectType.id, name: objectType.name, slug: objectType.slug, attributes: objectType.attributes }, data };
  });

  if (!result) {
    res.status(404).json({ error: `Object type '${objectSlug.data}' not found` });
    return;
  }
  res.json({ success: true, ...result });
}));

app.use('/api/v1', matchRouter());

app.post('/api/v1/ai/search', asyncRoute(async (req, res) => {
  const body = z.object({ query: z.string().trim().min(1).max(4000), limit: z.number().int().min(1).max(20).default(5) }).safeParse(req.body);
  const aiUrl = cfg.AI_ORCHESTRATOR_URL;
  const serviceToken = cfg.AI_SERVICE_TOKEN;
  if (!body.success) {
    res.status(400).json({ error: 'Invalid search request', details: body.error.flatten() });
    return;
  }
  if (!serviceToken) {
    res.status(503).json({ error: 'AI service is not configured' });
    return;
  }

  const response = await fetch(`${aiUrl}/api/v1/ai/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${serviceToken}`, 'x-tenant-id': req.tenant.tenantId },
    body: JSON.stringify(body.data),
    signal: AbortSignal.timeout(15_000)
  });
  res.status(response.status).json(await response.json());
}));

const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  // Body parser errors (too large, malformed JSON) are the client's.
  const status = typeof (error as { status?: unknown }).status === 'number' ? (error as { status: number }).status : 500;
  if (status < 500) return void res.status(status).json({ error: status === 413 ? 'Request too large' : 'Malformed request' });
  log('error', 'request failed', { id: res.getHeader('x-request-id'), path: req.path, ...errorFields(error) });
  res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

