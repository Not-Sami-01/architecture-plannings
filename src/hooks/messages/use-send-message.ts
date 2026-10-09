"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { messageKeys } from "./message-keys";
import type { MessageItem } from "./use-messages";

type SendMessageInput = { body: string; internal: boolean };

/** POST /api/orders/:id/messages — send a chat message (or admin internal note). */
export function useSendMessage(orderId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: SendMessageInput): Promise<MessageItem> => {
      const result = await api<MessageItem>("post", {
        url: API_ROUTES.messages(orderId),
        body: input,
      });
      return result.data as MessageItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(orderId) });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      sending: mutation.isPending,
    },
    actions: {
      send: mutation.mutateAsync,
    },
    query: mutation,
  };
}
