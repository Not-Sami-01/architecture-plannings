"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { messageKeys } from "./message-keys";
import type { MessageItem } from "./use-messages";

/** PATCH /api/orders/:id/messages/:messageId — edit a message. */
export function useUpdateMessage(orderId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      messageId,
      body,
      internal,
    }: {
      messageId: string;
      body: string;
      internal?: boolean;
    }): Promise<MessageItem> => {
      const result = await api<MessageItem>("patch", {
        url: API_ROUTES.message(orderId, messageId),
        body: { body, ...(internal === undefined ? {} : { internal }) },
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
      updating: mutation.isPending,
    },
    actions: {
      update: mutation.mutateAsync,
    },
    query: mutation,
  };
}
