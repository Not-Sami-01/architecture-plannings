"use client";

import { useRealtimeSync } from "@/hooks/realtime/use-realtime-sync";

/**
 * Headless realtime bridge: keeps the Ably subscription alive and lets the
 * hook invalidate query keys on pings. Mount once, inside Providers.
 */
export function RealtimeSync() {
  useRealtimeSync();
  return null;
}
