import { describe, expect, it } from "vitest";

import { ORDER_STATUSES } from "@/config/constants";
import type { OrderStatus } from "@/config/constants";
import { ApiError } from "@/lib/api/response";

import { ALLOWED_TRANSITIONS, allowedTransitions, assertTransition } from "./status";

const ALL = Object.values(ORDER_STATUSES) as OrderStatus[];

describe("status machine", () => {
  it("declares transitions for every status", () => {
    for (const status of ALL) {
      expect(ALLOWED_TRANSITIONS[status]).toBeDefined();
    }
  });

  it("keeps COMPLETED and CANCELLED terminal", () => {
    expect(ALLOWED_TRANSITIONS[ORDER_STATUSES.COMPLETED]).toHaveLength(0);
    expect(ALLOWED_TRANSITIONS[ORDER_STATUSES.CANCELLED]).toHaveLength(0);
  });

  it("allows the happy path end to end", () => {
    const path: OrderStatus[] = [
      ORDER_STATUSES.SUBMITTED,
      ORDER_STATUSES.QUOTED,
      ORDER_STATUSES.AWAITING_ADVANCE,
      ORDER_STATUSES.IN_DESIGN,
      ORDER_STATUSES.DRAFT_DELIVERED,
      ORDER_STATUSES.AWAITING_FINAL_PAYMENT,
      ORDER_STATUSES.COMPLETED,
    ];
    for (let i = 0; i < path.length - 1; i += 1) {
      expect(() => assertTransition(path[i], path[i + 1])).not.toThrow();
    }
  });

  it("allows the revision loop", () => {
    expect(() =>
      assertTransition(ORDER_STATUSES.DRAFT_DELIVERED, ORDER_STATUSES.REVISION_REQUESTED),
    ).not.toThrow();
    expect(() =>
      assertTransition(ORDER_STATUSES.REVISION_REQUESTED, ORDER_STATUSES.IN_DESIGN),
    ).not.toThrow();
  });

  it("rejects jumps that skip payment steps", () => {
    const forbidden: [OrderStatus, OrderStatus][] = [
      [ORDER_STATUSES.SUBMITTED, ORDER_STATUSES.IN_DESIGN],
      [ORDER_STATUSES.QUOTED, ORDER_STATUSES.IN_DESIGN],
      [ORDER_STATUSES.AWAITING_ADVANCE, ORDER_STATUSES.DRAFT_DELIVERED],
      [ORDER_STATUSES.DRAFT_DELIVERED, ORDER_STATUSES.COMPLETED],
      [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED],
      [ORDER_STATUSES.CANCELLED, ORDER_STATUSES.QUOTED],
      [ORDER_STATUSES.AWAITING_FINAL_PAYMENT, ORDER_STATUSES.IN_DESIGN],
    ];

    for (const [from, to] of forbidden) {
      try {
        assertTransition(from, to);
        throw new Error(`expected ${from} → ${to} to be rejected`);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(409);
        expect((error as ApiError).code).toBe("INVALID_TRANSITION");
      }
    }
  });

  it("cancellation is available from every pre-completed state", () => {
    const preCompleted = ALL.filter(
      (status) =>
        status !== ORDER_STATUSES.COMPLETED && status !== ORDER_STATUSES.CANCELLED,
    );
    for (const status of preCompleted) {
      expect(allowedTransitions(status)).toContain(ORDER_STATUSES.CANCELLED);
    }
  });

  it("allowedTransitions returns a copy (callers cannot mutate the table)", () => {
    const first = allowedTransitions(ORDER_STATUSES.SUBMITTED);
    first.push(ORDER_STATUSES.COMPLETED);
    expect(allowedTransitions(ORDER_STATUSES.SUBMITTED)).not.toContain(
      ORDER_STATUSES.COMPLETED,
    );
  });
});
