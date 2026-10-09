import { clerkClient } from "@clerk/nextjs/server";

import { ERROR_CODES, ROLES } from "@/config/constants";
import type { Role } from "@/config/constants";
import { config } from "@/config/config";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api/response";
import type { ApiUser } from "@/lib/api/types";

/**
 * User service (service layer: business logic lives in src/lib/**).
 * Clerk owns credentials; our DB owns identity data and roles. Every
 * authenticated request resolves through here, which also lazily creates the
 * local row on first sign-in (fresh-start migration: no pre-Clerk accounts
 * are linked).
 */

function roleForEmail(email: string): Role {
  return config.auth.adminEmails.includes(email) ? ROLES.ADMIN : ROLES.CLIENT;
}

export async function resolveApiUser(clerkId: string): Promise<ApiUser> {
  const existing = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (existing) {
    // Promotion is deliberate and cheap: remove an email from ADMIN_EMAILS and
    // demote on next sign-in by flipping the row; matching keeps env in sync.
    const role = roleForEmail(existing.email.toLowerCase());
    if (role !== existing.role) {
      await prisma.user.update({ where: { id: existing.id }, data: { role } });
      return { ...existing, role };
    }
    return existing;
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkId);
  const email = (
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress
  )
    ?.toLowerCase()
    .trim();

  if (!email) {
    throw new ApiError(401, "Your Clerk account has no email address.", ERROR_CODES.UNAUTHENTICATED);
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || email;
  const role = roleForEmail(email);

  try {
    return await prisma.user.create({
      data: { clerkId, email, name, role },
      select: { id: true, name: true, email: true, role: true },
    });
  } catch (error) {
    // Concurrent first requests, or a stray row already holding this email:
    // attach the clerkId instead of failing the sign-in.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2025")
    ) {
      const byClerk = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true, name: true, email: true, role: true },
      });
      if (byClerk) return byClerk;

      const byEmail = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (byEmail) {
        return await prisma.user.update({
          where: { id: byEmail.id },
          data: { clerkId, name, role },
          select: { id: true, name: true, email: true, role: true },
        });
      }
    }
    throw error;
  }
}
