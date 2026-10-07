import "dotenv/config";

import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration. Connection URLs for the CLI (migrate, studio, seed)
 * live here; the runtime client receives its URL through the PrismaPg adapter
 * in src/lib/db.ts. This file is build tooling, so it reads env directly.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    // Prisma spawns the command without a shell (no `VAR=... cmd`, no quoting),
    // so a tiny wrapper script sets up the react-server condition instead.
    seed: "sh prisma/seed.sh",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
