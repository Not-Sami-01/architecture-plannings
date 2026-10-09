"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { orderKeys } from "./order-keys";

type TransitionResult = { id: string; status: string };

/** POST /api/orders/:id/accept-quote — QUOTED → AWAITING_ADVANCE (owner only). */
export function useAcceptQuote() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string): Promise<TransitionResult> => {
      const result = await api<TransitionResult>("post", { url: API_ROUTES.acceptQuote(id) });
      return result.data as TransitionResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      toast.success("Quote accepted. We'll confirm your advance payment next.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      accepting: mutation.isPending,
    },
    actions: {
      accept: mutation.mutateAsync,
    },
    query: mutation,
  };
}
