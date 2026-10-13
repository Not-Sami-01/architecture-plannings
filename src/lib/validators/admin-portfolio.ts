import { z } from "zod";

import {
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_IMAGE,
  PORTFOLIO_PLOT_SIZES,
  PORTFOLIO_STYLE_OPTIONS,
} from "@/config/constants";

const styleValues = PORTFOLIO_STYLE_OPTIONS.map((option) => option.value) as [
  (typeof PORTFOLIO_STYLE_OPTIONS)[number]["value"],
  ...(typeof PORTFOLIO_STYLE_OPTIONS)[number]["value"][],
];

/** Server-side re-validation for portfolio image uploads (multipart). */
export const portfolioImageFileSchema = z.object({
  filename: z.string().min(1).max(255),
  mime: z.enum(PORTFOLIO_IMAGE.mimeTypes),
  size: z
    .number()
    .int()
    .positive("File is empty.")
    .max(PORTFOLIO_IMAGE.maxSourceBytes, PORTFOLIO_IMAGE.recommended),
});

export type PortfolioImageFileInput = z.infer<typeof portfolioImageFileSchema>;

/** Slug rule shared by the API and the admin form (lowercase kebab). */
export const portfolioSlugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.");

const portfolioCoreFields = {
  title: z.string().trim().min(3, "Title is too short.").max(120),
  slug: portfolioSlugSchema.optional(),
  category: z.enum(PORTFOLIO_CATEGORIES),
  plotSize: z.enum(PORTFOLIO_PLOT_SIZES),
  style: z.enum(styleValues),
  description: z.string().trim().max(600, "Keep the description under 600 characters.").optional(),
  featured: z.boolean().optional(),
  visible: z.boolean().optional(),
  /** File IDs of PORTFOLIO_IMAGE rows; first one is the cover. */
  imageIds: z.array(z.string().min(1)).max(PORTFOLIO_IMAGE.maxPerProject).optional(),
};

/** POST /api/admin/portfolio — create a project. */
export const createPortfolioProjectSchema = z.object(portfolioCoreFields);

/** PATCH /api/admin/portfolio/:id — at least one field required. */
export const updatePortfolioProjectSchema = createPortfolioProjectSchema
  .partial()
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "Nothing to update.",
  });

export type CreatePortfolioProjectInput = z.infer<typeof createPortfolioProjectSchema>;
export type UpdatePortfolioProjectInput = z.infer<typeof updatePortfolioProjectSchema>;

/** POST /api/admin/portfolio/reorder — full set, in display order. */
export const portfolioReorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Provide at least one id."),
});

export type PortfolioReorderInput = z.infer<typeof portfolioReorderSchema>;

/** GET /api/portfolio — public filters map lowercase tokens onto the schema. */
export const portfolioListQuerySchema = z.object({
  plot: z.string().trim().min(1).max(40).optional(),
  style: z.string().trim().min(1).max(40).optional(),
  category: z.string().trim().min(1).max(40).optional(),
});

export type PortfolioListQuery = z.infer<typeof portfolioListQuerySchema>;

/** Admin form schema: slug blank = auto-derive from title. */
export const portfolioFormSchema = createPortfolioProjectSchema.extend({
  slug: portfolioSlugSchema.or(z.literal("")).optional(),
  category: z.enum(PORTFOLIO_CATEGORIES),
  plotSize: z.enum(PORTFOLIO_PLOT_SIZES),
  style: z.enum(styleValues),
  imageIds: z.array(z.string().min(1)),
});

export type PortfolioFormValues = z.infer<typeof portfolioFormSchema>;
