import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma, withTenantContext, type PrismaClient } from '@vult/database';
import { TRIAL_DAYS } from '@vult/shared-types';
import { config } from '../config.js';
import { asyncRoute } from '../http.js';
import { log } from '../log.js';
import { tenantIsolationMiddleware } from '../middleware/tenantIsolation.js';
import { dummyHash, hashPassword, verifyPassword } from './password.js';
import { clearSessionCookie, setSessionCookie, signSession } from './session.js';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(10, 'Use at least 10 characters').max(200);
const signupInput = z.object({
  name: z.string().trim().min(1).max(120),
  email,
  password,
  workspace: z.string().trim().min(1).max(120),
  vatNumber: z.string().trim().regex(/^(IT)?\d{11}$/i, 'Partita IVA: 11 digits').optional().or(z.literal('')),
});
const loginInput = z.object({ email, password: z.string().min(1).max(200) });

/** Finds the user with this email across workspaces, through the read-only users_auth_lookup policy. */
async function findUserByEmail(address: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.auth_email', ${address}, true)`;
    return tx.user.findFirst({ where: { email: address }, select: { id: true, tenantId: true, role: true, name: true, email: true, passwordHash: true } });
  });
}

/** Companies, people and deals, so a new workspace works with the CRM and with invoice import from day one. */
async function createDefaultObjects(tx: PrismaClient, tenantId: string) {
  const objects = [
    { name: 'Companies', slug: 'companies', attributes: [['Company name', 'name', 'TEXT', true], ['Partita IVA', 'vat_number', 'TEXT', false], ['Industry', 'industry', 'STATUS', false]] },
    { name: 'People', slug: 'people', attributes: [['Name', 'name', 'TEXT', true], ['Email', 'email', 'TEXT', false], ['Company', 'company', 'OBJECT_REF', false]] },
    { name: 'Deals', slug: 'deals', attributes: [['Deal name', 'name', 'TEXT', true], ['Stage', 'stage', 'STATUS', false], ['Value', 'value', 'CURRENCY', false]] },
  ] as const;
  for (const o of objects) {
    await tx.objectType.create({
      data: {
        tenantId,
        name: o.name,
        slug: o.slug,
        isSystem: true,
        attributes: { create: o.attributes.map(([name, slug, dataType, isRequired]) => ({ name, slug, dataType, isRequired })) },
      },
    });
  }
}

const publicUser = (u: { id: string; name: string; email: string; role: string }, workspace: { id: string; name: string }) => ({
  user: { id: u.id, name: u.name, email: u.email, role: u.role },
  workspace,
});

export function authRouter(): Router {
  const r = Router();
  const limiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts, try again in a few minutes' } });

  r.post('/signup', limiter, asyncRoute(async (req, res) => {
    if (!config().SIGNUP_ENABLED) return void res.status(403).json({ error: 'Sign-up is closed. Ask for an invitation.' });
    const body = signupInput.safeParse(req.body);
    if (!body.success) return void res.status(400).json({ error: 'Check the highlighted fields', fields: body.error.flatten().fieldErrors });
    if (await findUserByEmail(body.data.email)) return void res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });

    const tenantId = randomUUID();
    const userId = randomUUID();
    const passwordHash = await hashPassword(body.data.password);
    const vat = body.data.vatNumber ? body.data.vatNumber.replace(/^IT/i, '') : null;
    await withTenantContext(tenantId, async (tx) => {
      await tx.tenant.create({
        data: { id: tenantId, name: body.data.workspace, legalName: body.data.workspace, vatNumber: vat, trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000) },
      });
      await tx.user.create({ data: { id: userId, tenantId, email: body.data.email, name: body.data.name, role: 'ADMIN', passwordHash, lastLoginAt: new Date() } });
      await createDefaultObjects(tx, tenantId);
    });
    setSessionCookie(res, signSession({ tenantId, userId, role: 'ADMIN' }));
    log('info', 'workspace created', { tenantId });
    res.status(201).json({ success: true, ...publicUser({ id: userId, name: body.data.name, email: body.data.email, role: 'ADMIN' }, { id: tenantId, name: body.data.workspace }) });
  }));

  r.post('/login', limiter, asyncRoute(async (req, res) => {
    const body = loginInput.safeParse(req.body);
    if (!body.success) return void res.status(400).json({ error: 'Enter your email and password' });
    const user = await findUserByEmail(body.data.email);
    const ok = await verifyPassword(body.data.password, user?.passwordHash ?? (await dummyHash()));
    if (!user || !user.passwordHash || !ok) return void res.status(401).json({ error: 'Email or password is incorrect' });
    const workspace = await withTenantContext(user.tenantId, async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      return tx.tenant.findUniqueOrThrow({ where: { id: user.tenantId }, select: { id: true, name: true } });
    });
    setSessionCookie(res, signSession({ tenantId: user.tenantId, userId: user.id, role: user.role }));
    res.json({ success: true, ...publicUser(user, workspace) });
  }));

  r.post('/logout', (_req, res) => {
    clearSessionCookie(res);
    res.status(204).end();
  });

  r.get('/me', tenantIsolationMiddleware, asyncRoute(async (req, res) => {
    const found = await withTenantContext(req.tenant.tenantId, async (tx) => ({
      user: await tx.user.findUnique({ where: { id: req.tenant.userId }, select: { id: true, name: true, email: true, role: true } }),
      workspace: await tx.tenant.findUnique({ where: { id: req.tenant.tenantId }, select: { id: true, name: true } }),
    }));
    // API tokens from the token script have no user row; sessions whose user was removed are refused.
    if (!found.workspace || !found.user) {
      clearSessionCookie(res);
      return void res.status(401).json({ error: 'Session expired' });
    }
    res.json({ success: true, user: found.user, workspace: found.workspace });
  }));

  r.post('/me', tenantIsolationMiddleware, asyncRoute(async (req, res) => {
    const body = z.object({ name: z.string().trim().min(1).max(120) }).safeParse(req.body);
    if (!body.success) return void res.status(400).json({ error: 'Enter your name' });
    const user = await withTenantContext(req.tenant.tenantId, (tx) =>
      tx.user.update({ where: { id: req.tenant.userId }, data: { name: body.data.name }, select: { id: true, name: true, email: true, role: true } }),
    );
    res.json({ success: true, user });
  }));

  return r;
}
