import { z } from "zod";

import { PAGINATION, ROLES } from "@/config/constants";

/** GET /api/admin/users query (plan C1). */
export const adminUserListQuerySchema = z.object({
  q: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(120).optional(),
  ),
  role: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.enum([ROLES.CLIENT, ROLES.ADMIN]).optional(),
  ),
  page: z.coerce.number().int().min(1).default(PAGINATION.defaultPage),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.maxPageSize)
    .default(PAGINATION.defaultPageSize),
});

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

/** PATCH /api/admin/users/:id — name and role only (deletion is out of scope). */
export const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  role: z.enum([ROLES.CLIENT, ROLES.ADMIN]).optional(),
});

export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
