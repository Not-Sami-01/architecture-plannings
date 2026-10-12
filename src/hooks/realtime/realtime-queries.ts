import { REALTIME_EVENTS } from "@/config/constants";
import { orderKeys } from "@/hooks/orders/order-keys";
import { adminOrderKeys } from "@/hooks/orders/admin-order-keys";
import { messageKeys } from "@/hooks/messages/message-keys";
import { paymentKeys } from "@/hooks/payments/payment-keys";
import { settingsKeys } from "@/hooks/settings/settings-keys";
import { adminStatsKeys } from "@/hooks/admin/admin-stats-keys";

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
    // The client's order views and the admin detail both show price/status;
    // the dashboard funnel follows every status move.
    case REALTIME_EVENTS.quoteSent:
    case REALTIME_EVENTS.statusChanged:
      return [orderKeys.all, adminOrderKeys.all, adminStatsKeys.all];
    // Admin list and dashboard react to a brand-new submission.
    case REALTIME_EVENTS.orderCreated:
      return [adminOrderKeys.all, adminStatsKeys.all];
    // New message in a thread (refId is the order/thread id): the thread and
    // both parties' unread badges change.
    case REALTIME_EVENTS.messageCreated:
    case REALTIME_EVENTS.messageRead:
      return event.refId
        ? [messageKeys.list(event.refId), messageKeys.unread(event.refId)]
        : [];
    // Edits/deletes only change the thread itself.
    case REALTIME_EVENTS.messageUpdated:
    case REALTIME_EVENTS.messageDeleted:
      return event.refId ? [messageKeys.list(event.refId)] : [];
    // A charge was created or decided: payment lists, both order views, stats.
    case REALTIME_EVENTS.paymentCreated:
    case REALTIME_EVENTS.paymentUpdated:
      return [paymentKeys.all, orderKeys.all, adminOrderKeys.all, adminStatsKeys.all];
    // Deliverables & revisions (plan 3): order screens + dashboard counters.
    case REALTIME_EVENTS.revisionRequested:
    case REALTIME_EVENTS.revisionAccepted:
    case REALTIME_EVENTS.draftDelivered:
    case REALTIME_EVENTS.finalsRegistered:
      return [orderKeys.all, adminOrderKeys.all, adminStatsKeys.all];
    // The site currency changed: every money label re-renders.
    case REALTIME_EVENTS.settingsUpdated:
      return [settingsKeys.detail()];
    default:
      return [];
  }
}
