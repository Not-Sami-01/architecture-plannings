import { describe, expect, it } from "vitest";

import { ORDER_STATUSES } from "@/config/constants";

import { trackingStepIndex } from "./order-steps";

describe("trackingStepIndex", () => {
  it("maps each main-path status to its step", () => {
    expect(trackingStepIndex(ORDER_STATUSES.SUBMITTED)).toBe(0);
    expect(trackingStepIndex(ORDER_STATUSES.QUOTED)).toBe(1);
    expect(trackingStepIndex(ORDER_STATUSES.AWAITING_ADVANCE)).toBe(2);
    expect(trackingStepIndex(ORDER_STATUSES.IN_DESIGN)).toBe(3);
    expect(trackingStepIndex(ORDER_STATUSES.DRAFT_DELIVERED)).toBe(4);
    expect(trackingStepIndex(ORDER_STATUSES.AWAITING_FINAL_PAYMENT)).toBe(5);
    expect(trackingStepIndex(ORDER_STATUSES.COMPLETED)).toBe(6);
  });

  it("folds the revision loop onto the draft step", () => {
    expect(trackingStepIndex(ORDER_STATUSES.REVISION_REQUESTED)).toBe(
      trackingStepIndex(ORDER_STATUSES.DRAFT_DELIVERED),
    );
  });

  it("returns -1 for cancelled and unknown statuses", () => {
    expect(trackingStepIndex(ORDER_STATUSES.CANCELLED)).toBe(-1);
    expect(trackingStepIndex("SOMETHING_ELSE")).toBe(-1);
  });
});
