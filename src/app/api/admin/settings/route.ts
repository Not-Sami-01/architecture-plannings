import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { ROLES } from "@/config/constants";
import { setCurrency } from "@/lib/settings";
import { settingsSchema, type SettingsInput } from "@/lib/validators/settings";
import type { Handler } from "@/lib/api/types";

// Admin updates app settings (plan 3). Relabel-only — amounts never convert.
const patchHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(await setCurrency(user, getBody<SettingsInput>(req).currency));
};

export const PATCH = withMiddleware(patchHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(settingsSchema),
]);
