import { handlers } from "@/lib/auth";

/**
 * Auth.js owns these endpoints (login, logout, session, CSRF). They are
 * framework-managed — CSRF-protected and signature-verified internally — so
 * they are intentionally not wrapped by withMiddleware, like webhooks.
 */
export const { GET, POST } = handlers;
