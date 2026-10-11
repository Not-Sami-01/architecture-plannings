"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { messageKeys } from "./message-keys";

/** GET /api/orders/:id/messages/unread-count — counterpart messages not yet read. */
export function useUnreadMessages(orderId: string, enabled = true) {
  const query = useQuery({
    queryKey: messageKeys.unread(orderId),
    queryFn: async ({ signal }) => {
      const result = await api<{ count: number }>("get", {
        url: API_ROUTES.messagesUnreadCount(orderId),
        signal,
      });
      return result.data?.count ?? 0;
    },
    enabled: Boolean(orderId) && enabled,
  });

  return {
    data: query.data ?? 0,
    loadings: {
      loading: query.isPending,
    },
    actions: {},
    query,
  };
}
