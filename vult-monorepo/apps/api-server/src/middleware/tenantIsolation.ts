import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { TenantContext } from '@vult/shared-types';
import { CSRF_HEADER, readCookie, SESSION_COOKIE } from '../auth/session.js';
import { config } from '../config.js';

export type AuthenticatedTenantRequest = Request & {
  tenant: TenantContext;
};

declare global {
  namespace Express {
    interface Request {
      tenant: TenantContext;
    }
  }
}

type VultClaims = JwtPayload & {
  tenantId: string;
  role: TenantContext['role'];
};

const roles = new Set<TenantContext['role']>(['ADMIN', 'MANAGER', 'MEMBER', 'READ_ONLY']);

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Accepts either an API token (Authorization: Bearer, for scripts and integrations) or the browser session cookie.
 * Cookie-authenticated writes must carry the CSRF header, which a page on another site cannot add.
 */
export function tenantIsolationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.header('authorization');
  const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  const cookie = bearer ? undefined : readCookie(req, SESSION_COOKIE);
  const token = bearer ?? cookie;
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (cookie && !SAFE_METHODS.has(req.method) && req.header(CSRF_HEADER) !== '1') {
    res.status(403).json({ error: 'Missing CSRF header' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config().JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string') throw new Error('Invalid token payload');
    const claims = decoded as VultClaims;
    if (
      typeof claims.sub !== 'string' ||
      typeof claims.tenantId !== 'string' ||
      !roles.has(claims.role)
    ) {
      throw new Error('Missing tenant claims');
    }
    req.tenant = {
      tenantId: claims.tenantId,
      userId: claims.sub,
      role: claims.role
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}

export function requireWriteAccess(req: Request, res: Response, next: NextFunction): void {
  const { role } = req.tenant;
  if (role === 'READ_ONLY') {
    res.status(403).json({ error: 'Write access required' });
    return;
  }
  next();
}