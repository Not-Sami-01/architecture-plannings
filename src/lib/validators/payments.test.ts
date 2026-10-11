import { describe, expect, it } from "vitest";

import {
  createPaymentFormSchema,
  createPaymentSchema,
  paymentProofSchema,
  verifyPaymentSchema,
} from "./payments";

describe("createPaymentSchema", () => {
  it("accepts a whole positive amount with a valid type", () => {
    const parsed = createPaymentSchema.safeParse({ amount: 250_000, type: "ADVANCE" });
    expect(parsed.success).toBe(true);
  });

  it("rejects zero, negatives and fractional amounts", () => {
    expect(createPaymentSchema.safeParse({ amount: 0, type: "ADVANCE" }).success).toBe(false);
    expect(createPaymentSchema.safeParse({ amount: -5, type: "ADVANCE" }).success).toBe(false);
    expect(createPaymentSchema.safeParse({ amount: 10.5, type: "ADVANCE" }).success).toBe(false);
  });

  it("rejects an unknown payment type", () => {
    expect(createPaymentSchema.safeParse({ amount: 100, type: "BRIBE" }).success).toBe(false);
  });

  it("caps the optional note at 500 chars", () => {
    expect(
      createPaymentSchema.safeParse({ amount: 100, type: "FINAL", note: "x".repeat(501) }).success,
    ).toBe(false);
    expect(
      createPaymentSchema.safeParse({ amount: 100, type: "FINAL", note: "ok" }).success,
    ).toBe(true);
  });
});

describe("createPaymentFormSchema", () => {
  it("mirrors the server schema for the RHF dialog", () => {
    expect(createPaymentFormSchema.safeParse({ amount: 99, type: "EXTRA_REVISION" }).success).toBe(
      true,
    );
    expect(createPaymentFormSchema.safeParse({ amount: 0, type: "EXTRA_REVISION" }).success).toBe(
      false,
    );
  });
});

describe("verifyPaymentSchema", () => {
  it("accepts PAID and REJECTED only", () => {
    expect(verifyPaymentSchema.safeParse({ status: "PAID" }).success).toBe(true);
    expect(verifyPaymentSchema.safeParse({ status: "REJECTED" }).success).toBe(true);
    expect(verifyPaymentSchema.safeParse({ status: "PENDING" }).success).toBe(false);
  });
});

describe("paymentProofSchema", () => {
  it("requires a lowercase-alnum id (zod cuid2)", () => {
    // Zod's cuid2 rule is /^[0-9a-z]+$/ — dashes/uppercase are rejected.
    expect(paymentProofSchema.safeParse({ fileId: "Not-A-File" }).success).toBe(false);
    expect(
      paymentProofSchema.safeParse({ fileId: "clxyz0000000000000000000" }).success,
    ).toBe(true);
  });
});
