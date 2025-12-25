import { PrismaClient } from "../../prisma/generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

let prismaInstance: PrismaClient | null = null;

function createPrismaClient(): PrismaClient {
  if (!process.env.DIRECT_URL) {
    console.warn('[Prisma] DIRECT_URL not set - client will fail at runtime if database access is needed'); //@ts-ignore
    return new PrismaClient() as any;
  }

  try {
    if (!globalForPrisma.pool) {
      globalForPrisma.pool = new pg.Pool({
        connectionString: process.env.DIRECT_URL,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
        max: 10,
      });
    }

    const adapter = new PrismaPg(globalForPrisma.pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error('[Prisma] Failed to initialize client:', error);
    throw error;
  }
}

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = createPrismaClient();
    
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }
  }
  
  return prismaInstance;
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
