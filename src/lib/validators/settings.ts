import { z } from "zod";

import { isSupportedCurrency } from "@/config/constants";

/** PATCH /api/admin/settings — currently only the site currency (plan 3). */
export const settingsSchema = z.object({
  currency: z
    .string()
    .refine(isSupportedCurrency, "That currency is not supported."),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
