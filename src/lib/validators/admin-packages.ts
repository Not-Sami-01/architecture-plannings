import { z } from "zod";

/** Slug rule shared by the API and the admin form. */
export const packageSlugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.");

const deliverablesSchema = z
  .array(z.string().trim().min(1).max(120))
  .min(1, "Add at least one deliverable.")
  .max(20);

/** POST /api/admin/packages */
export const createPackageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: packageSlugSchema.optional(),
  description: z.string().trim().min(2).max(500),
  price: z.number().int().min(1, "Price must be at least 1.").max(99_999_999),
  revisionLimit: z.number().int().min(0).max(20),
  deliverables: deliverablesSchema,
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

/** PATCH /api/admin/packages/:id — at least one field required. */
export const updatePackageSchema = createPackageSchema
  .partial()
  .extend({ active: z.boolean().optional() })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "Nothing to update.",
  });

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

/** Splits a one-per-line textarea into a deliverables array. */
export function splitDeliverables(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Admin form schema: same rules as the API, but deliverables arrive as text. */
export const packageFormSchema = createPackageSchema.extend({
  slug: packageSlugSchema.or(z.literal("")).optional(),
  active: z.boolean().optional(),
  deliverables: z
    .string()
    .min(1, "Add at least one deliverable.")
    .refine((text) => {
      const lines = splitDeliverables(text);
      return lines.length >= 1 && lines.length <= 20 && lines.every((l) => l.length <= 120);
    }, "One deliverable per line (max 20, 120 characters each)."),
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;
