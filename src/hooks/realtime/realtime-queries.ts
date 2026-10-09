import { REALTIME_EVENTS } from "@/config/constants";
import { orderKeys } from "@/hooks/orders/order-keys";
import { adminOrderKeys } from "@/hooks/orders/admin-order-keys";

/** Id-only ping as it arrives over the wire. */
export type RealtimePing = {
  type: string;
  refId?: string;
};

/**
 * Which query-key roots a ping invalidates. Pure so it can be unit-tested;
 * payloads never carry anything but ids (see realtime.ts on the server).
 */
export function realtimeEventQueries(
  event: RealtimePing,
): ReadonlyArray<readonly unknown[]> {
  switch (event.type) {
    // The client's order views and the admin detail both show price/status.
    case REALTIME_EVENTS.quoteSent:
    case REALTIME_EVENTS.statusChanged:
      return [orderKeys.all, adminOrderKeys.all];
    // Admin list (and stats later) react to a brand-new submission.
    case REALTIME_EVENTS.orderCreated:
      return [adminOrderKeys.all];
    default:
      return [];
  }
}
