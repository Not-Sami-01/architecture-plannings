import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers/index";

import { config } from "@/config/config";
import { ROUTES } from "@/config/constants";
import type { Role } from "@/config/constants";

import { prisma } from "@/lib/db";

/**
 * Auth.js (v5) configuration. Google is optional: it is only registered when
 * GOOGLE_CLIENT_ID/SECRET are set, so local/dev setups keep working without
 * them. Roles come from the DB.
 */
const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (credentials) => {
      const email =
        typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";

      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      // Compare against a dummy hash even when the user is missing to keep
      // response times similar (no user-enumeration via timing).
      const passwordHash =
        user?.passwordHash ?? "$2a$12$C6UzMDM.H6dfI/f/IKcEeO1SFPoLXjZHzMd3B6SBuMEBLnHqiNCl6";
      const valid = await bcrypt.compare(password, passwordHash);

      if (!user || !user.passwordHash || !valid) return null;

      return { id: user.id, email: user.email, name: user.name, role: user.role };
    },
  }),
];

// Google sign-in links to an existing credentials account with the same email
// instead of rejecting it. Google verifies email ownership, and this keeps the
// seeded ADMIN reachable with either provider.
if (config.auth.google.clientId && config.auth.google.clientSecret) {
  providers.push(
    Google({
      clientId: config.auth.google.clientId,
      clientSecret: config.auth.google.clientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: config.auth.secret,
  trustHost: true,
  pages: { signIn: ROUTES.login },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") session.user.id = token.id;
      if (typeof token.role === "string") session.user.role = token.role as Role;
      return session;
    },
  },
});
