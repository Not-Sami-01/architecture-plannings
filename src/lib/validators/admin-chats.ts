import { z } from "zod";

import { PAGINATION } from "@/config/constants";

/** GET /api/admin/threads query (plan C2). */
export const adminThreadListQuerySchema = z.object({
  q: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(120).optional(),
  ),
  page: z.coerce.number().int().min(1).default(PAGINATION.defaultPage),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.maxPageSize)
    .default(PAGINATION.defaultPageSize),
});

export type AdminThreadListQuery = z.infer<typeof adminThreadListQuerySchema>;
