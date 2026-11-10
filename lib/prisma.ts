import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
  });

globalForPrisma.prisma = prisma;
