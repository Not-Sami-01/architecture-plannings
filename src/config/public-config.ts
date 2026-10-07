/**
 * Client-safe public values. Only NEXT_PUBLIC_* variables may be read here
 * (AGENTS.md, "Configuration and Constants").
 *
 * NEXT_PUBLIC_* vars are inlined at build time; the fallbacks below match
 * .env.example so local development works without extra setup.
 */

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export const publicConfig = {
  appUrl,
  whatsappNumber,
  isDev: process.env.NODE_ENV === "development",
} as const;
