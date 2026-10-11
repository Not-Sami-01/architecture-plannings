import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db", () => {
  const prisma = {
    user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  };
  return { prisma };
});

const clerkUpdateMetadata = vi.fn(async () => undefined);
const clerkGetUser = vi.fn(async () => ({
  primaryEmailAddress: { emailAddress: "user@test.dev" },
  emailAddresses: [],
  firstName: "Test",
  lastName: "User",
  publicMetadata: {} as Record<string, unknown>,
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(async () => ({
    users: {
      getUser: clerkGetUser,
      updateUserMetadata: clerkUpdateMetadata,
    },
  })),
}));

vi.mock("@/config/config", () => ({
  config: { auth: { adminEmails: ["admin@test.dev"] } },
}));

import { prisma } from "@/lib/db";
import { ROLES } from "@/config/constants";

// resolveApiUser and setUserRole are imported after mocks are registered.
import { resolveApiUser, setUserRole } from "./users";

const userFindUnique = prisma.user.findUnique as unknown as Mock;
const userUpdate = prisma.user.update as unknown as Mock;
const userCreate = prisma.user.create as unknown as Mock;

const row = (role: string) => ({ id: "usr_1", name: "Test", email: "user@test.dev", role });

type ClerkUserOverride = {
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses?: { emailAddress: string }[];
  firstName?: string | null;
  lastName?: string | null;
  publicMetadata?: Record<string, unknown>;
};

const setClerkUser = (override: ClerkUserOverride) => {
  clerkGetUser.mockResolvedValueOnce({
    primaryEmailAddress: undefined as unknown as { emailAddress: string } | null,
    emailAddresses: [] as unknown as { emailAddress: string }[],
    firstName: undefined as unknown as string | null,
    lastName: undefined as unknown as string | null,
    ...override,
  } as never);
};

beforeEach(() => {
  vi.clearAllMocks();
  clerkGetUser.mockImplementation(async () => ({
    primaryEmailAddress: { emailAddress: "user@test.dev" },
    emailAddresses: [],
    firstName: "Test",
    lastName: "User",
    publicMetadata: {} as Record<string, unknown>,
  }));
  userUpdate.mockImplementation(async (args: { data: { role: string } }) => ({
    id: "usr_1",
    name: "Test",
    email: "user@test.dev",
    role: args.data.role,
  }));
  userCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
    id: "usr_1",
    ...args.data,
  }));
});

describe("resolveApiUser — existing user (role sync)", () => {
  it("returns the DB row untouched when Clerk metadata matches", async () => {
    setClerkUser({ publicMetadata: { role: "CLIENT" } });
    userFindUnique.mockResolvedValue(row(ROLES.CLIENT));

    const user = await resolveApiUser("clerk_1");

    expect(user.role).toBe(ROLES.CLIENT);
    expect(userUpdate).not.toHaveBeenCalled();
    expect(clerkUpdateMetadata).not.toHaveBeenCalled();
  });

  it("promotes when Clerk metadata says ADMIN and the row says CLIENT", async () => {
    setClerkUser({ publicMetadata: { role: "ADMIN" } });
    userFindUnique.mockResolvedValue(row(ROLES.CLIENT));

    const user = await resolveApiUser("clerk_1");

    expect(user.role).toBe(ROLES.ADMIN);
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: ROLES.ADMIN } }),
    );
    // The mirror write is idempotent: setUserRole re-syncs Clerk with the
    // same value, and the pair converges after one request.
    expect(clerkUpdateMetadata).toHaveBeenCalledWith("clerk_1", {
      publicMetadata: { role: ROLES.ADMIN },
    });
  });

  it("demotes when Clerk metadata is absent and the email is not in ADMIN_EMAILS", async () => {
    // No metadata → env bootstrap decides by email.
    setClerkUser({ publicMetadata: {} });
    userFindUnique.mockResolvedValue({ ...row(ROLES.ADMIN), email: "someone@test.dev" });

    const user = await resolveApiUser("clerk_1");

    expect(user.role).toBe(ROLES.CLIENT);
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: ROLES.CLIENT } }),
    );
  });

  it("falls back to ADMIN_EMAILS when the Clerk fetch fails (outage safety)", async () => {
    clerkGetUser.mockRejectedValueOnce(new Error("clerk down"));
    userFindUnique.mockResolvedValue({ ...row(ROLES.ADMIN), email: "admin@test.dev" });

    const user = await resolveApiUser("clerk_1");

    expect(user.role).toBe(ROLES.ADMIN);
    expect(userUpdate).not.toHaveBeenCalled();
  });
});

describe("resolveApiUser — first sign-in (bootstrap)", () => {
  it("bootstraps an admin from ADMIN_EMAILS and writes the role to Clerk metadata", async () => {
    setClerkUser({
      primaryEmailAddress: { emailAddress: "admin@test.dev" },
      firstName: "Admin",
    });
    userFindUnique.mockResolvedValue(null);
    userCreate.mockResolvedValueOnce(row(ROLES.ADMIN));

    const user = await resolveApiUser("clerk_admin");

    expect(user.role).toBe(ROLES.ADMIN);
    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: ROLES.ADMIN }) }),
    );
    expect(clerkUpdateMetadata).toHaveBeenCalledWith("clerk_admin", {
      publicMetadata: { role: ROLES.ADMIN },
    });
  });

  it("creates clients without touching Clerk metadata", async () => {
    setClerkUser({
      primaryEmailAddress: { emailAddress: "client@test.dev" },
      firstName: "Client",
    });
    userFindUnique.mockResolvedValue(null);
    userCreate.mockResolvedValueOnce(row(ROLES.CLIENT));

    const user = await resolveApiUser("clerk_client");

    expect(user.role).toBe(ROLES.CLIENT);
    expect(clerkUpdateMetadata).not.toHaveBeenCalled();
  });
});

describe("setUserRole (admin panel role change)", () => {
  it("writes the DB mirror and Clerk metadata together", async () => {
    userUpdate.mockResolvedValueOnce(row(ROLES.ADMIN));

    await setUserRole("usr_1", "clerk_1", ROLES.ADMIN);

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "usr_1" },
      data: { role: ROLES.ADMIN },
      select: { id: true, name: true, email: true, role: true },
    });
    expect(clerkUpdateMetadata).toHaveBeenCalledWith("clerk_1", {
      publicMetadata: { role: ROLES.ADMIN },
    });
  });

  it("keeps the DB change even when the Clerk write fails (fire-safe)", async () => {
    clerkUpdateMetadata.mockRejectedValueOnce(new Error("rate limited"));
    userUpdate.mockResolvedValueOnce(row(ROLES.CLIENT));

    const rowResult = await setUserRole("usr_1", "clerk_1", ROLES.CLIENT);

    expect(rowResult.role).toBe(ROLES.CLIENT);
  });
});
