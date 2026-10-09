import { describe, expect, it } from "vitest";

import { REALTIME_EVENTS } from "@/config/constants";
import { orderKeys } from "@/hooks/orders/order-keys";
import { adminOrderKeys } from "@/hooks/orders/admin-order-keys";
import { messageKeys } from "@/hooks/messages/message-keys";

import { realtimeEventQueries } from "./realtime-queries";

describe("realtimeEventQueries", () => {
  it("a quote or status ping refreshes both the client and admin order views", () => {
    for (const type of [REALTIME_EVENTS.quoteSent, REALTIME_EVENTS.statusChanged]) {
      expect(realtimeEventQueries({ type, refId: "ord_1" })).toEqual([
        orderKeys.all,
        adminOrderKeys.all,
      ]);
    }
  });

  it("a new order pings only the admin views", () => {
    expect(realtimeEventQueries({ type: REALTIME_EVENTS.orderCreated, refId: "ord_2" })).toEqual([
      adminOrderKeys.all,
    ]);
  });

  it("a new message pings only that thread's list", () => {
    expect(realtimeEventQueries({ type: REALTIME_EVENTS.messageCreated, refId: "ord_3" })).toEqual(
      [messageKeys.list("ord_3")],
    );
    expect(realtimeEventQueries({ type: REALTIME_EVENTS.messageCreated })).toEqual([]);
  });

  it("ignores unknown or malformed event types", () => {
    expect(realtimeEventQueries({ type: "totally.unknown" })).toEqual([]);
    expect(realtimeEventQueries({ type: "" })).toEqual([]);
  });

  it("pings are id-only: the mapping never reads payload content", () => {
    // refId differences must not change which keys are invalidated.
    const a = realtimeEventQueries({ type: REALTIME_EVENTS.statusChanged, refId: "ord_a" });
    const b = realtimeEventQueries({ type: REALTIME_EVENTS.statusChanged, refId: "ord_b" });
    expect(a).toEqual(b);
  });
});
