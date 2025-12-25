import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

let prismaInstance: PrismaClient | null = null;
let initError: Error | null = null;

function getPrismaClient(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  // If we already tried and failed, throw the same error
  if (initError) {
    throw initError;
  }

  try {
    if (!process.env.DIRECT_URL) {
      if (process.env.NODE_ENV === 'production' && !process.env.DIRECT_URL) {
        console.warn('[Prisma] DIRECT_URL not available during build, deferring initialization');
        prismaInstance = new PrismaClient() as any;
        return prismaInstance;
      }
      throw new Error("[Prisma] DIRECT_URL is required");
    }

    if (!globalForPrisma.pool) {
      globalForPrisma.pool = new pg.Pool({
        connectionString: process.env.DIRECT_URL,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
        max: 10,
      });
    }

    const adapter = new PrismaPg(globalForPrisma.pool);
    prismaInstance = new PrismaClient({ adapter });
    
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }

    return prismaInstance;
  } catch (error) {
    initError = error as Error;
    throw error;
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined;
    }
    
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
