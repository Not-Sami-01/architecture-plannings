"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { messageKeys } from "./message-keys";

export type MessageAttachment = {
  id: string;
  filename: string;
  mime: string;
  size: number;
};

export type MessageReadReceipt = {
  readerId: string;
  readAt: string;
};

export type MessageItem = {
  id: string;
  body: string;
  internal: boolean;
  editedAt: string | null;
  createdAt: string;
  sender: { id: string; name: string | null; role: "CLIENT" | "ADMIN" };
  attachments: MessageAttachment[];
  /** Read receipts: who has seen this message and when (plan 2 P2). */
  reads: MessageReadReceipt[];
};

/** GET /api/orders/:id/messages — chronological thread (no internal notes for clients). */
export function useMessages(orderId: string) {
  const query = useQuery({
    queryKey: messageKeys.list(orderId),
    queryFn: async ({ signal }) => {
      const result = await api<MessageItem[]>("get", {
        url: API_ROUTES.messages(orderId),
        signal,
      });
      return result.data ?? [];
    },
    enabled: Boolean(orderId),
  });

  return {
    data: query.data ?? [],
    loadings: {
      loading: query.isPending,
      fetching: query.isFetching,
    },
    actions: {},
    query,
  };
}
