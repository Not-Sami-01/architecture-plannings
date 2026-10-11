import { describe, expect, it } from "vitest";

import { FILE_LIMITS, MESSAGES } from "@/config/constants";

import { messageSchema, messageUpdateSchema } from "./message";

describe("messageSchema", () => {
  it("accepts a normal message and defaults internal to false", () => {
    expect(messageSchema.parse({ body: "  Hello?  " })).toEqual({
      body: "Hello?",
      internal: false,
      fileIds: [],
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

  it("defaults fileIds to an empty array and caps chat attachments", () => {
    expect(messageSchema.parse({ body: "hi" }).fileIds).toEqual([]);

    const ids = Array.from({ length: FILE_LIMITS.maxChatAttachments }, () => "c" + "0".repeat(23));
    expect(messageSchema.safeParse({ body: "hi", fileIds: ids }).success).toBe(true);
    expect(
      messageSchema.safeParse({ body: "hi", fileIds: [...ids, "c" + "1".repeat(23)] }).success,
    ).toBe(false);
  });

  it("rejects malformed attachment ids", () => {
    expect(messageSchema.safeParse({ body: "hi", fileIds: ["not-a-valid-id!"] }).success).toBe(
      false,
    );
  });
});

describe("messageUpdateSchema", () => {
  it("accepts a body without an internal flag", () => {
    expect(messageUpdateSchema.parse({ body: "fixed" })).toEqual({ body: "fixed" });
  });

  it("keeps the internal toggle for admins (service enforces the role)", () => {
    expect(messageUpdateSchema.parse({ body: "fixed", internal: true })).toEqual({
      body: "fixed",
      internal: true,
    });
  });
});
