// Test-only environment values. This file lives outside src/ so that the
// ESLint rule banning process.env does not apply to it.
const env = process.env as Record<string, string | undefined>;

env.NODE_ENV = "test";
env.DATABASE_URL = env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test";
env.AUTH_SECRET = env.AUTH_SECRET ?? "test-secret-0123456789abcdef";
env.AUTH_URL = env.AUTH_URL ?? "http://localhost:3000";
