import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { TenantContext } from '@vult/shared-types';

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

export function tenantIsolationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.header('authorization');
  const secret = process.env.JWT_SECRET;
  if (!secret || !authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(authorization.slice(7), secret, { algorithms: ['HS256'] });
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