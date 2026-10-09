"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { orderKeys } from "./order-keys";

type TransitionResult = { id: string; status: string };

/** POST /api/orders/:id/approve-draft — DRAFT_DELIVERED → AWAITING_FINAL_PAYMENT (owner only). */
export function useApproveDraft() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string): Promise<TransitionResult> => {
      const result = await api<TransitionResult>("post", { url: API_ROUTES.approveDraft(id) });
      return result.data as TransitionResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      toast.success("Draft approved. Final payment unlocks your files.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      approving: mutation.isPending,
    },
    actions: {
      approve: mutation.mutateAsync,
    },
    query: mutation,
  };
}
