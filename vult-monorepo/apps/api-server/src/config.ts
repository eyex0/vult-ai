import { z } from 'zod';

const bool = z.enum(['true', 'false']).transform((v) => v === 'true');
const PLACEHOLDER = /replace-with|changeme|local-development-only/i;

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    API_PORT: z.coerce.number().int().positive().default(4000),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
    JSON_BODY_LIMIT: z.string().default('1mb'),
    /** Set when the web app and the API live on sibling subdomains, e.g. ".vult.it". */
    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SECURE: bool.optional(),
    SESSION_DAYS: z.coerce.number().int().min(1).max(90).default(7),
    SIGNUP_ENABLED: bool.default('true'),
    AI_ORCHESTRATOR_URL: z.string().default('http://localhost:8000'),
    AI_SERVICE_TOKEN: z.string().optional(),
    /** Optional: each early-access request is also POSTed here (Slack incoming webhook, Make, Zapier). */
    LEADS_WEBHOOK_URL: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    if (PLACEHOLDER.test(env.JWT_SECRET)) ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'still the example value' });
    if (PLACEHOLDER.test(env.DATABASE_URL)) ctx.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: 'uses the example password' });
    if (env.CORS_ORIGINS.split(',').some((o) => o.trim() === '*')) ctx.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'must list origins, not *' });
  });

export type Config = z.infer<typeof schema> & { corsOrigins: string[]; cookieSecure: boolean };

/** Reads and checks the environment once, so a bad deploy fails at startup instead of on the first request. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Managed platforms (Render, Railway, Cloud Run) tell the service which port to use in PORT.
  const parsed = schema.safeParse({ API_PORT: env.PORT, ...env });
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid API configuration:\n${problems}`);
  }
  const c = parsed.data;
  return {
    ...c,
    corsOrigins: c.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
    cookieSecure: c.COOKIE_SECURE ?? c.NODE_ENV === 'production',
  };
}

let cached: Config | undefined;
export const config = (): Config => (cached ??= loadConfig());
