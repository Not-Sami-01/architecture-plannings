import { z } from "zod";

import { MESSAGES } from "@/config/constants";

export const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, { message: "Write a message first." })
    .max(MESSAGES.maxLength, {
      message: `Messages are limited to ${MESSAGES.maxLength} characters.`,
    }),
  // Defaults to false: forging `internal: true` as a client is rejected server-side.
  internal: z.boolean().optional().default(false),
});

export type MessageInput = z.infer<typeof messageSchema>;
