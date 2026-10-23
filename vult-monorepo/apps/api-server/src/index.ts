import { prisma } from '@vult/database';
import { config } from './config.js';
import { errorFields, log } from './log.js';

// Fail fast on a bad environment before anything else loads.
let port: number;
try {
  port = config().API_PORT;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
const { app } = await import('./app.js');

const server = app.listen(port, '0.0.0.0', () => log('info', 'api listening', { port, env: config().NODE_ENV }));
process.on('unhandledRejection', (error) => log('error', 'unhandled rejection', errorFields(error)));

async function shutdown() {
  log('info', 'shutting down');
  // Stop taking connections, let in-flight requests finish, then force exit after 10 s.
  setTimeout(() => process.exit(1), 10_000).unref();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);