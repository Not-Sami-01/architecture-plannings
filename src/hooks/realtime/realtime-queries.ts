import { REALTIME_EVENTS } from "@/config/constants";
import { orderKeys } from "@/hooks/orders/order-keys";
import { adminOrderKeys } from "@/hooks/orders/admin-order-keys";
import { messageKeys } from "@/hooks/messages/message-keys";
import { paymentKeys } from "@/hooks/payments/payment-keys";
import { settingsKeys } from "@/hooks/settings/settings-keys";
import { adminStatsKeys } from "@/hooks/admin/admin-stats-keys";
import { adminThreadKeys } from "@/hooks/admin/admin-thread-keys";

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
    // New message or read receipt in a thread (refId is the order id): the
    // thread, both parties' unread badges, the admin chats list (previews
    // move to the top) and the order views' chat triggers change.
    case REALTIME_EVENTS.messageCreated:
    case REALTIME_EVENTS.messageRead:
      return event.refId
        ? [
            messageKeys.list(event.refId),
            messageKeys.unread(event.refId),
            adminThreadKeys.list({}),
            orderKeys.all,
          ]
        : [adminThreadKeys.list({}), orderKeys.all];
    // Edits/deletes only change the thread itself.
    case REALTIME_EVENTS.messageUpdated:
    case REALTIME_EVENTS.messageDeleted:
      return event.refId ? [messageKeys.list(event.refId)] : [];
    // A charge was created or decided: payment lists, both order views, stats.
    case REALTIME_EVENTS.paymentCreated:
    case REALTIME_EVENTS.paymentUpdated:
      return [paymentKeys.all, orderKeys.all, adminOrderKeys.all, adminStatsKeys.all];
    // The client downloaded a deliverable: only the admin order detail shows
    // the "Seen by client" badge (refId is the order id).
    case REALTIME_EVENTS.fileSeen:
      return event.refId ? [adminOrderKeys.detail(event.refId)] : [];
    // Deliverables & revisions (plan 3): order screens + dashboard counters.
    case REALTIME_EVENTS.revisionRequested:
    case REALTIME_EVENTS.revisionAccepted:
    case REALTIME_EVENTS.draftDelivered:
    case REALTIME_EVENTS.finalsRegistered:
      return [orderKeys.all, adminOrderKeys.all, adminStatsKeys.all];
    // The site currency changed: settings feed the CurrencyProvider label and
    // the server-rendered marketing pages read getSiteSettings() on their next
    // visit; the order views carry money too, so refresh them as well.
    case REALTIME_EVENTS.settingsUpdated:
      return [settingsKeys.detail(), orderKeys.all, adminOrderKeys.all, adminStatsKeys.all];
    default:
      return [];
  }
}
