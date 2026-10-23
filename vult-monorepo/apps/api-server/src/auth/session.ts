import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { TenantContext } from '@vult/shared-types';
import { config } from '../config.js';

export const SESSION_COOKIE = 'vult_session';
/** Browsers sending the session cookie must also send this header on writes: cross-site pages cannot set it. */
export const CSRF_HEADER = 'x-vult-csrf';

export function signSession(ctx: TenantContext): string {
  return jwt.sign({ sub: ctx.userId, tenantId: ctx.tenantId, role: ctx.role, typ: 'session' }, config().JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${config().SESSION_DAYS}d`,
  });
}

const cookieOptions = () => ({
  httpOnly: true,
  secure: config().cookieSecure,
  sameSite: 'lax' as const,
  path: '/',
  ...(config().COOKIE_DOMAIN ? { domain: config().COOKIE_DOMAIN } : {}),
});

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: config().SESSION_DAYS * 86_400_000 });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.header('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}
