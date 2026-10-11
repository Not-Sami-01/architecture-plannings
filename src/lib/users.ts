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
 *
 * Role source of truth is the Clerk session: `publicMetadata.role` is read
 * fresh on every request and written here (bootstrap + admin panel changes),
 * so a role change is visible on the user's very next request without token
 * customization. The DB `User.role` column is a mirror, kept in sync on each
 * resolve so queries/joins (requireRole, filters) stay cheap and indexed.
 *
 * Clerk owns credentials; our DB owns identity data. Every authenticated
 * request resolves through here, which lazily creates the local row on first
 * sign-in (fresh-start migration: no pre-Clerk accounts are linked).
 */

const userSelect = { id: true, name: true, email: true, role: true } as const;
type UserRow = { id: string; name: string | null; email: string; role: Role };

function roleForEmail(email: string): Role {
  return config.auth.adminEmails.includes(email) ? ROLES.ADMIN : ROLES.CLIENT;
}

/** Reads the role from Clerk metadata, falling back to the env bootstrap. */
async function roleFromClerk(clerkId: string, email: string): Promise<Role> {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const metaRole = clerkUser.publicMetadata?.role;
    if (typeof metaRole === "string" && metaRole in ROLES && (ROLES as Record<string, string>)[metaRole]) {
      return metaRole as Role;
    }
  } catch {
    // Metadata unreadable: fall back to the ADMIN_EMAILS bootstrap below so
    // an outage of the user detail endpoint cannot lock people out.
  }
  return roleForEmail(email);
}

async function syncRoleToClerk(clerkId: string, role: Role): Promise<void> {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: { role },
    });
  } catch (error) {
    // Fire-safe: the DB mirror already holds the change; log and continue.
    console.error(
      `[users] Clerk role sync failed for ${clerkId}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Single place where Clerk metadata and the DB mirror are written together.
 * The DB write wins (it is the queryable mirror); the Clerk metadata write is
 * fire-safe.
 */
export async function setUserRole(userId: string, clerkId: string | null, role: Role): Promise<UserRow> {
  const row = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: userSelect,
  });
  if (clerkId) await syncRoleToClerk(clerkId, role);
  return row;
}

export async function resolveApiUser(clerkId: string): Promise<ApiUser> {
  const existing = await prisma.user.findUnique({
    where: { clerkId },
    select: userSelect,
  });

  if (existing) {
    // Clerk metadata is the fresh claim; the DB row follows it. When the two
    // disagree (admin-panel change, first refresh after bootstrap) the row is
    // re-mirrored on the spot.
    const role = await roleFromClerk(clerkId, existing.email.toLowerCase());
    if (role !== existing.role) {
      await setUserRole(existing.id, clerkId, role);
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
    ?.trim();

  if (!email) {
    throw new ApiError(401, "Your Clerk account has no email address.", ERROR_CODES.UNAUTHENTICATED);
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || email;
  // First sign-in bootstrap: ADMIN_EMAILS seeds the role into Clerk metadata
  // and the DB row, so the admin panel needs no Clerk-dashboard editing.
  const role = roleForEmail(email);

  try {
    const created = await prisma.user.create({
      data: { clerkId, email, name, role },
      select: userSelect,
    });
    if (role === ROLES.ADMIN) {
      await syncRoleToClerk(clerkId, role);
    }
    return created;
  } catch (error) {
    // Concurrent first requests, or a stray row already holding this email:
    // attach the clerkId instead of failing the sign-in.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2025")
    ) {
      const byClerk = await prisma.user.findUnique({
        where: { clerkId },
        select: userSelect,
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
          select: userSelect,
        });
      }
    }
    throw error;
  }
}
