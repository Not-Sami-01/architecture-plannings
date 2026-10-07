import bcrypt from "bcryptjs";

import { ERROR_CODES, ROLES } from "@/config/constants";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import type { RegisterInput } from "@/lib/validators/auth";

/**
 * User service (service layer: business logic lives in src/lib/**).
 * Registration is public and always creates a CLIENT; admins come from seed.
 */

const BCRYPT_ROUNDS = 12;

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new ApiError(409, "This email is already registered.", ERROR_CODES.CONFLICT);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const phone = input.phone?.trim() || null;

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      phone,
      role: ROLES.CLIENT,
    },
    select: { id: true, email: true },
  });

  return user;
}
