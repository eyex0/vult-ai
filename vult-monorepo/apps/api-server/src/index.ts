import { prisma } from '@vult/database';
import { app } from './app.js';

const port = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`[Vult API] listening on ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);