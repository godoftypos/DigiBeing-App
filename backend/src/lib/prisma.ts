import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        // Make the log level conditional based on the environment
        log: ['query', 'error', 'warn'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;