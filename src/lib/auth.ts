import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { config } from "@/config/config";
import { ROUTES } from "@/config/constants";
import type { Role } from "@/config/constants";

import { prisma } from "@/lib/db";

/**
 * Auth.js (v5) configuration. Email/password now; Google follows the same
 * provider list when credentials are present. Roles come from the DB.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: config.auth.secret,
  trustHost: true,
  pages: { signIn: ROUTES.login },
  providers: [
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
  ],
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
