import { z } from "zod";

/**
 * Auth-related schemas. Shared between the client forms (React Hook Form)
 * and the API routes (validateBody) so both sides stay in sync.
 */

export const registerSchema = z.object({
  name: z.string().min(2, "Please enter your full name").max(80),
  email: z.email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{7,20}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;
