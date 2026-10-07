import "server-only";

import { z } from "zod";

/**
 * Validated environment access. `process.env` may only be read here
 * (AGENTS.md, "Configuration and Constants"). Import `config` instead.
 */

const postgresUrl = z
  .string()
  .min(1)
  .refine((v) => /^postgres(ql)?:\/\//.test(v), "Must be a postgres:// or postgresql:// URL");// Empty string env vars must count as unset for optional URL fields
const optionalUrl = () =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.url().optional(),
  );

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database
  DATABASE_URL: postgresUrl,

  // Auth
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  AUTH_URL: optionalUrl(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Storage (S3-compatible private bucket; empty values = local `.storage/` fallback)
  STORAGE_ENDPOINT: optionalUrl(),
  STORAGE_REGION: z.string().default("auto"),
  STORAGE_BUCKET: z.string().default("archiplan-private"),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  ADMIN_NOTIFY_EMAIL: z.email().optional(),

  // Payments
  PAYMENT_PROVIDER: z.enum(["manual", "stripe", "other"]).default("manual"),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),

  // Seed (used by `prisma db seed` only; change in production)
  ADMIN_EMAIL: z.email().default("admin@archiplan.local"),
  ADMIN_PASSWORD: z.string().min(8).default("change-me-2026"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const config = {
  app: {
    nodeEnv: parsed.data.NODE_ENV,
  },
  db: {
    url: parsed.data.DATABASE_URL,
  },
  auth: {
    secret: parsed.data.AUTH_SECRET,
    url: parsed.data.AUTH_URL,
    google: {
      clientId: parsed.data.GOOGLE_CLIENT_ID,
      clientSecret: parsed.data.GOOGLE_CLIENT_SECRET,
    },
  },
  storage: {
    endpoint: parsed.data.STORAGE_ENDPOINT,
    region: parsed.data.STORAGE_REGION,
    bucket: parsed.data.STORAGE_BUCKET,
    accessKeyId: parsed.data.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: parsed.data.STORAGE_SECRET_ACCESS_KEY,
  },
  email: {
    resendApiKey: parsed.data.RESEND_API_KEY,
    from: parsed.data.EMAIL_FROM,
    adminNotifyEmail: parsed.data.ADMIN_NOTIFY_EMAIL,
  },
  payments: {
    provider: parsed.data.PAYMENT_PROVIDER,
    webhookSecret: parsed.data.PAYMENT_WEBHOOK_SECRET,
  },
  seed: {
    adminEmail: parsed.data.ADMIN_EMAIL,
    adminPassword: parsed.data.ADMIN_PASSWORD,
  },
} as const;

export type Config = typeof config;
