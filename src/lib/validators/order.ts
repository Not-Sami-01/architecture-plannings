import { z } from "zod";

import {
  DIRECTIONS,
  KITCHEN_TYPES,
  PLOT_UNITS,
  ROAD_SIDES,
  STYLES,
  FILE_LIMITS,
} from "@/config/constants";

/**
 * Order creation schema (FR-6–FR-11). Shared by the multi-step form
 * (React Hook Form) and POST /api/orders (validateBody).
 */

export const plotSchema = z.object({
  width: z
    .number({ message: "Plot width is required" })
    .positive("Plot width must be greater than zero")
    .max(1000),
  length: z
    .number({ message: "Plot length is required" })
    .positive("Plot length must be greater than zero")
    .max(1000),
  unit: z.enum(PLOT_UNITS),
  facing: z.enum(DIRECTIONS),
  roadSides: z
    .array(z.enum(ROAD_SIDES))
    .min(1, "Select at least one road side"),
  city: z.string().min(2, "Please enter your city").max(80),
});

export const requirementsSchema = z.object({
  floors: z
    .number({ message: "Floors are required" })
    .int()
    .min(1, "At least one floor")
    .max(4),
  bedrooms: z.number({ message: "Bedrooms are required" }).int().min(0).max(20),
  bathrooms: z
    .number({ message: "Bathrooms are required" })
    .int()
    .min(0)
    .max(20),
  kitchenType: z.enum(KITCHEN_TYPES),
  garage: z.boolean(),
  lounge: z.boolean(),
  extras: z.string().max(2000).optional().or(z.literal("")),
});

export const styleBudgetSchema = z.object({
  style: z.enum(STYLES),
  budget: z.number().int().positive().max(10_000_000_000).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const orderSchema = z.object({
  packageId: z.string().cuid2("Please choose a package"),
  plot: plotSchema,
  requirements: requirementsSchema,
  style: styleBudgetSchema.shape.style,
  budget: styleBudgetSchema.shape.budget,
  notes: styleBudgetSchema.shape.notes,
  fileIds: z.array(z.string().cuid2()).max(FILE_LIMITS.maxClientFiles),
});

export type PlotInput = z.infer<typeof plotSchema>;
export type RequirementsInput = z.infer<typeof requirementsSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
/** Alias for form usage; identical to OrderInput now that numbers are plain. */
export type OrderFormValues = OrderInput;
