import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    if (!process.env.DIRECT_URL) {
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
  }
  
  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
