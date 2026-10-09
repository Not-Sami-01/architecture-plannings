import { describe, expect, it } from "vitest";

import { MESSAGES } from "@/config/constants";

import { messageSchema } from "./message";

describe("messageSchema", () => {
  it("accepts a normal message and defaults internal to false", () => {
    expect(messageSchema.parse({ body: "  Hello?  " })).toEqual({
      body: "Hello?",
      internal: false,
    });
  });

  it("keeps an explicit internal flag (admins only — enforced in the service)", () => {
    expect(messageSchema.parse({ body: "Note", internal: true }).internal).toBe(true);
  });

  it("rejects empty or whitespace-only bodies", () => {
    expect(messageSchema.safeParse({ body: "" }).success).toBe(false);
    expect(messageSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(messageSchema.safeParse({}).success).toBe(false);
  });

  it("enforces the length limit from constants", () => {
    expect(messageSchema.safeParse({ body: "x".repeat(MESSAGES.maxLength) }).success).toBe(true);
    expect(messageSchema.safeParse({ body: "x".repeat(MESSAGES.maxLength + 1) }).success).toBe(
      false,
    );
  });

  it("rejects non-boolean internal flags", () => {
    expect(messageSchema.safeParse({ body: "hi", internal: "yes" }).success).toBe(false);
  });
});
