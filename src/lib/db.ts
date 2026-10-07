import { PrismaPg } from "@prisma/adapter-pg";

import { config } from "@/config/config";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * The one Prisma client (AGENTS.md, Architecture Rules #3).
 * Prisma 7 uses driver adapters; reuse the instance across hot reloads.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: config.db.url });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (config.app.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}
