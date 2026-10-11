import { z } from "zod";

import { FILE_LIMITS, MESSAGES } from "@/config/constants";

const bodyField = z
  .string()
  .trim()
  .min(1, { message: "Write a message first." })
  .max(MESSAGES.maxLength, {
    message: `Messages are limited to ${MESSAGES.maxLength} characters.`,
  });

export const messageSchema = z.object({
  body: bodyField,
  // Defaults to false: forging `internal: true` as a client is rejected server-side.
  internal: z.boolean().optional().default(false),
  // Chat attachments (plan Phase B): uploaded first (presign → PUT → confirm
  // with CHAT_ATTACHMENT kind), then attached here by id.
  fileIds: z
    .array(z.string().cuid2())
    .max(FILE_LIMITS.maxChatAttachments, {
      message: `Up to ${FILE_LIMITS.maxChatAttachments} attachments per message.`,
    })
    .default([]),
});

export type MessageInput = z.infer<typeof messageSchema>;

/** PATCH /api/orders/:id/messages/:messageId. */
export const messageUpdateSchema = z.object({
  body: bodyField,
  // Admin-only field; a client sending it at all is a 400 (service enforces).
  internal: z.boolean().optional(),
});

export type MessageUpdateInput = z.infer<typeof messageUpdateSchema>;

/** POST /api/orders/:id/messages/read — bulk read receipts (plan 2 P2). */
export const markReadSchema = z.object({
  messageIds: z
    .array(z.string().cuid2())
    .min(1, { message: "No messages to mark." })
    .max(MESSAGES.maxReadBatch, {
      message: `Up to ${MESSAGES.maxReadBatch} messages per read receipt.`,
    }),
});

export type MarkReadInput = z.infer<typeof markReadSchema>;
