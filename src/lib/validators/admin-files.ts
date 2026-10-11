import { z } from "zod";

import { FILE_KINDS, PAGINATION, type FileKind } from "@/config/constants";

const fileKindValues = Object.values(FILE_KINDS) as [FileKind, ...FileKind[]];

/** GET /api/admin/files query (plan C3). */
export const adminFileListQuerySchema = z.object({
  kind: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.enum(fileKindValues).optional(),
  ),
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

export type AdminFileListQuery = z.infer<typeof adminFileListQuerySchema>;

/** PATCH /api/admin/files/:id — rename or reclassify (never amounts or keys). */
export const adminFileUpdateSchema = z.object({
  filename: z.string().trim().min(1).max(255).optional(),
  kind: z.enum(fileKindValues).optional(),
});

export type AdminFileUpdateInput = z.infer<typeof adminFileUpdateSchema>;
