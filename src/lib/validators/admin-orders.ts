import { z } from "zod";

import { ORDER_STATUSES, PAGINATION } from "@/config/constants";

type OrderStatusValue = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

/**
 * GET /api/admin/orders query schema (API.md §8).
 * `paymentStatus` and numeric date filters arrive in Phase 4 (payments).
 */
export const adminOrderListQuerySchema = z.object({
  status: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.enum(Object.values(ORDER_STATUSES) as [OrderStatusValue, ...OrderStatusValue[]]).optional(),
    ),
  q: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(120).optional(),
  ),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().min(1).default(PAGINATION.defaultPage),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.maxPageSize)
    .default(PAGINATION.defaultPageSize),
});

export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;
