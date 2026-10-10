"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import type { QuoteInput } from "@/lib/validators/admin-orders";

import { adminOrderKeys } from "./admin-order-keys";

type QuoteResult = { id: string; status: string };

/** POST /api/admin/orders/:id/quote — sends the quote (SUBMITTED → QUOTED). */
export function useSendQuote() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: QuoteInput }): Promise<QuoteResult> => {
      const result = await api<QuoteResult>("post", {
        url: API_ROUTES.adminQuote(id),
        body: input,
      });
      return result.data as QuoteResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      toast.success("Quote sent to the client.");
    },
    onError: (error) => {
      // A 409 usually means the UI was stale (order already quoted/advanced) —
      // refetch so the quote form disappears and the real state shows.
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
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
