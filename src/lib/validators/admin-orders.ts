import { z } from "zod";

import {
  KITCHEN_TYPES,
  ORDER_STATUSES,
  ORDER_DEFAULTS,
  PAGINATION,
  PLOT_UNITS,
  STYLES,
} from "@/config/constants";

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

/** POST /api/admin/orders/:id/quote (API.md §8). Money is integer PKR. */
export const quoteSchema = z.object({
  totalPrice: z
    .number({ message: "Enter a price." })
    .int("Price must be a whole number.")
    .positive("Price must be greater than zero."),
  advancePercent: z.coerce
    .number()
    .int()
    .min(1, "Advance must be at least 1%.")
    .max(100, "Advance cannot exceed 100%.")
    .default(ORDER_DEFAULTS.advancePercent),
  message: z
    .string()
    .trim()
    .max(1000, "Keep the quote message under 1000 characters.")
    .optional(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

/**
 * Client-side twin of `quoteSchema` for the quote form: no coerce/default
 * (the form always produces numbers), so it pairs cleanly with zodResolver.
 */
export const quoteFormSchema = z.object({
  totalPrice: z
    .number({ message: "Enter a price." })
    .int("Price must be a whole number.")
    .positive("Price must be greater than zero."),
  advancePercent: z
    .number({ message: "Enter the advance percent." })
    .int()
    .min(1, "Advance must be at least 1%.")
    .max(100, "Advance cannot exceed 100%."),
  message: z
    .string()
    .trim()
    .max(1000, "Keep the quote message under 1000 characters.")
    .optional(),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

/**
 * PATCH /api/admin/orders/:id (plan Phase D2). Field edits only — status and
 * price are never set here (status machine, quote flow).
 */
export const adminOrderUpdateSchema = z.object({
  city: z.string().trim().min(2).max(80).optional(),
  plot: z
    .object({
      width: z.number().positive().max(1000),
      length: z.number().positive().max(1000),
      unit: z.enum(PLOT_UNITS),
    })
    .optional(),
  requirements: z
    .object({
      floors: z.number().int().min(1).max(4),
      bedrooms: z.number().int().min(0).max(20),
      bathrooms: z.number().int().min(0).max(20),
      kitchenType: z.enum(KITCHEN_TYPES),
      garage: z.boolean(),
      lounge: z.boolean(),
      extras: z.string().max(2000).optional().or(z.literal("")),
    })
    .optional(),
  style: z.enum(STYLES).optional(),
  budget: z.number().int().positive().max(10_000_000_000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  packageId: z.string().cuid2().optional(),
});

export type AdminOrderUpdateInput = z.infer<typeof adminOrderUpdateSchema>;

/** POST /api/admin/orders/:id/status (API.md §8). */
export const statusChangeSchema = z.object({
  to: z.enum(Object.values(ORDER_STATUSES) as [OrderStatusValue, ...OrderStatusValue[]]),
  reason: z
    .string()
    .trim()
    .max(500, "Keep the reason under 500 characters.")
    .optional(),
});

export type StatusChangeInput = z.infer<typeof statusChangeSchema>;
