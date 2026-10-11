"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { messageKeys } from "./message-keys";

/** DELETE /api/orders/:id/messages/:messageId — delete a message (+attachments). */
export function useDeleteMessage(orderId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ messageId }: { messageId: string }): Promise<void> => {
      await api("delete", {
        url: API_ROUTES.message(orderId, messageId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(orderId) });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: undefined,
    loadings: {
      deleting: mutation.isPending,
    },
    actions: {
      remove: mutation.mutateAsync,
    },
    query: mutation,
  };
}
