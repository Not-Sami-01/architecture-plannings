"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { API_ROUTES, MESSAGES } from "@/config/constants";
import { api } from "@/lib/api-client/api";

import { messageKeys } from "./message-keys";

type MarkReadResult = { marked: number };

/** POST /api/orders/:id/messages/read — bulk read receipts (plan 2 P2). */
export function useMarkMessagesRead(orderId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (messageIds: string[]): Promise<MarkReadResult> => {
      // Batches are capped server-side too; chunk here so a huge thread
      // still goes through in legal slices.
      let marked = 0;
      for (let index = 0; index < messageIds.length; index += MESSAGES.maxReadBatch) {
        const chunk = messageIds.slice(index, index + MESSAGES.maxReadBatch);
        const result = await api<MarkReadResult>("post", {
          url: API_ROUTES.messagesRead(orderId),
          body: { messageIds: chunk },
          redirectOnAuth: false,
        });
        marked += result.data?.marked ?? 0;
      }
      return { marked };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.list(orderId) });
      void queryClient.invalidateQueries({ queryKey: messageKeys.unread(orderId) });
    },
  });

  return {
    data: mutation.data,
    loadings: {
      marking: mutation.isPending,
    },
    actions: {
      mark: mutation.mutateAsync,
    },
    query: mutation,
  };
}
