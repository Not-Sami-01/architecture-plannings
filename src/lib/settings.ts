import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import {
  APP,
  REALTIME_EVENTS,
  ROLES,
  SETTINGS_KEYS,
  isSupportedCurrency,
} from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import { publishAdminsEvent } from "@/lib/realtime";

/**
 * App settings (plan 3, SiteSetting table). The public surface is just the
 * currency; more keys land here later without another migration dance.
 */

export const SETTINGS_CACHE_TAG = "site-settings";

type SiteSettings = {
  currency: string;
};

async function readSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: SETTINGS_KEYS.currency },
    select: { value: true },
  });
  // A missing or hand-edited row must never take the app down.
  const currency =
    row && isSupportedCurrency(row.value) ? row.value : APP.currency;
  return { currency };
}

/** Cached app-wide; invalidated by `setCurrency` via revalidateTag. */
export const getSiteSettings = unstable_cache(readSettings, ["site-settings"], {
  tags: [SETTINGS_CACHE_TAG],
});

/**
 * Admin changes the site currency. Relabel-only: stored amounts are never
 * converted (in-flight orders keep their Order.currency snapshot).
 */
export async function setCurrency(user: ApiUser, code: string) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();
  if (!isSupportedCurrency(code)) {
    throw ApiError.badRequest("That currency is not supported.");
  }

  await prisma.siteSetting.upsert({
    where: { key: SETTINGS_KEYS.currency },
    update: { value: code },
    create: { key: SETTINGS_KEYS.currency, value: code },
  });

  // Next 16: "max" is stale-while-revalidate (old currency labels keep
  // being served) — this is a route handler, so expire immediately instead.
  // The next marketing/dashboard read is a blocking cache miss.
  revalidateTag(SETTINGS_CACHE_TAG, { expire: 0 });

  // Admins see the change instantly; other clients pick it up on their next
  // settings fetch (`use-settings` staleTime) — order money is snapshot-safe.
  void publishAdminsEvent({
    type: REALTIME_EVENTS.settingsUpdated,
    refId: SETTINGS_KEYS.currency,
  });

  return { currency: code };
}
