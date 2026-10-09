import { Rest } from "ably";

import { config } from "@/config/config";
import {
  REALTIME_CHANNELS,
  REALTIME_TOKEN_TTL_MS,
  ROLES,
} from "@/config/constants";
import type { RealtimeEventType } from "@/config/constants";

/**
 * Server-side realtime (Ably). Publishes id-only pings that tell subscribed
 * clients which TanStack Query keys to invalidate — the ping is a trigger,
 * never the payload itself (no names, emails, bodies, or amounts).
 *
 * Realtime is optional: with ABLY_API_KEY unset every helper no-ops, and a
 * publish failure must never break or delay the main action (like emails).
 */

export type RealtimeEvent = {
  type: RealtimeEventType;
  /** Order or thread id the event is about. */
  refId?: string;
};

let client: Rest | null | undefined;

function getRest(): Rest | null {
  const key = config.realtime.ablyApiKey;
  if (!key) return null;
  if (client === undefined) {
    try {
      client = new Rest({ key });
    } catch (error) {
      client = null;
      console.warn(
        "[realtime] Ably init failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }
  return client;
}

async function publish(channelName: string, event: RealtimeEvent): Promise<void> {
  try {
    const rest = getRest();
    if (!rest) return;
    await rest.channels.get(channelName).publish(REALTIME_CHANNELS.ping, event);
  } catch (error) {
    console.warn(
      "[realtime] publish failed:",
      error instanceof Error ? error.message : error,
    );
  }
}

/** Ping the order owner (quote sent, status changed by admin). */
export function publishUserEvent(userId: string, event: RealtimeEvent): Promise<void> {
  return publish(REALTIME_CHANNELS.user(userId), event);
}

/** Ping every signed-in admin (quote accepted, draft approved, new order). */
export function publishAdminsEvent(event: RealtimeEvent): Promise<void> {
  return publish(REALTIME_CHANNELS.admins, event);
}

/** Subscribe-only capability: own channel for clients, plus the admin role channel. */
export function buildRealtimeCapability(user: {
  id: string;
  role: string;
}): Record<string, string[]> {
  const capability: Record<string, string[]> = {
    [REALTIME_CHANNELS.user(user.id)]: ["subscribe"],
  };
  if (user.role === ROLES.ADMIN) {
    capability[REALTIME_CHANNELS.admins] = ["subscribe"];
  }
  return capability;
}

/**
 * Signed TokenRequest for the browser SDK (valid for REALTIME_TOKEN_TTL_MS;
 * single use — clients must request a fresh one for every renewal).
 * Returns null when realtime is not configured.
 */
export async function createRealtimeTokenRequest(user: {
  id: string;
  role: string;
}) {
  const rest = getRest();
  if (!rest) return null;
  return rest.auth.createTokenRequest({
    clientId: user.id,
    ttl: REALTIME_TOKEN_TTL_MS,
    capability: JSON.stringify(buildRealtimeCapability(user)),
  });
}
