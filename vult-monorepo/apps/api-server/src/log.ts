type Level = 'debug' | 'info' | 'warn' | 'error';

/** One JSON object per line: what log collectors (Loki, CloudWatch, Datadog) read without parsing rules. */
export function log(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === 'test' && level !== 'error') return;
  const entry = { time: new Date().toISOString(), level, msg, ...fields };
  (level === 'error' ? console.error : console.log)(JSON.stringify(entry, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)));
}

export function errorFields(error: unknown) {
  return error instanceof Error ? { error: error.message, stack: error.stack?.split('\n').slice(0, 6).join('\n') } : { error: String(error) };
}
