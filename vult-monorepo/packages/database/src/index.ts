import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { vultPrisma?: PrismaClient };

export const prisma = globalForPrisma.vultPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.vultPrisma = prisma;

export async function withTenantContext<T>(
	tenantId: string,
	callback: (transaction: PrismaClient) => Promise<T>
): Promise<T> {
	return prisma.$transaction(async (transaction) => {
		await transaction.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
		return callback(transaction as unknown as PrismaClient);
	});
}

export * from '@prisma/client';
