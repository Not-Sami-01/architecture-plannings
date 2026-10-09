import { describe, expect, it } from "vitest";

import { ORDER_STATUSES, ORDER_DEFAULTS } from "@/config/constants";

import { quoteSchema, quoteFormSchema, statusChangeSchema } from "./admin-orders";

describe("quoteSchema", () => {
  it("accepts a valid quote and defaults the advance percent", () => {
    const parsed = quoteSchema.parse({ totalPrice: 25000 });
    expect(parsed).toEqual({
      totalPrice: 25000,
      advancePercent: ORDER_DEFAULTS.advancePercent,
      message: undefined,
    });
  });

  it("accepts an explicit advance percent and message", () => {
    const parsed = quoteSchema.parse({
      totalPrice: 40000,
      advancePercent: 50,
      message: "Delivery in 7 days.",
    });
    expect(parsed.advancePercent).toBe(50);
    expect(parsed.message).toBe("Delivery in 7 days.");
  });

  it("rejects non-integer, zero, and negative prices", () => {
    expect(quoteSchema.safeParse({ totalPrice: 1999.5 }).success).toBe(false);
    expect(quoteSchema.safeParse({ totalPrice: 0 }).success).toBe(false);
    expect(quoteSchema.safeParse({ totalPrice: -5 }).success).toBe(false);
    expect(quoteSchema.safeParse({}).success).toBe(false);
  });

  it("bounds the advance percent to 1..100", () => {
    expect(quoteSchema.safeParse({ totalPrice: 1, advancePercent: 0 }).success).toBe(false);
    expect(quoteSchema.safeParse({ totalPrice: 1, advancePercent: 101 }).success).toBe(false);
    expect(quoteSchema.safeParse({ totalPrice: 1, advancePercent: 100 }).success).toBe(true);
  });

  it("caps the message length", () => {
    expect(
      quoteSchema.safeParse({ totalPrice: 1, message: "x".repeat(1001) }).success,
    ).toBe(false);
  });

  it("keeps money strict but coerces the advance percent", () => {
    // Money must arrive as a JSON number — string prices are rejected.
    expect(quoteSchema.safeParse({ totalPrice: "25000" }).success).toBe(false);
    const parsed = quoteSchema.safeParse({ totalPrice: 25000, advancePercent: "40" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.advancePercent).toBe(40);
  });
});

describe("quoteFormSchema", () => {
  it("requires numbers the form produced", () => {
    expect(quoteFormSchema.safeParse({ totalPrice: 25000, advancePercent: 40 }).success).toBe(
      true,
    );
    expect(quoteFormSchema.safeParse({ totalPrice: 0, advancePercent: 40 }).success).toBe(false);
    // No coerce in the form schema — a string is a programming error upstream.
    expect(
      quoteFormSchema.safeParse({ totalPrice: "25000", advancePercent: 40 }).success,
    ).toBe(false);
  });
});

describe("statusChangeSchema", () => {
  it("accepts every status as a target", () => {
    for (const status of Object.values(ORDER_STATUSES)) {
      expect(statusChangeSchema.safeParse({ to: status }).success).toBe(true);
    }
  });

  it("rejects unknown targets and caps the reason", () => {
    expect(statusChangeSchema.safeParse({ to: "DONE" }).success).toBe(false);
    expect(statusChangeSchema.safeParse({}).success).toBe(false);
    expect(
      statusChangeSchema.safeParse({ to: ORDER_STATUSES.QUOTED, reason: "x".repeat(501) })
        .success,
    ).toBe(false);
    expect(
      statusChangeSchema.safeParse({ to: ORDER_STATUSES.QUOTED, reason: "ok" }).success,
    ).toBe(true);
  });
});
