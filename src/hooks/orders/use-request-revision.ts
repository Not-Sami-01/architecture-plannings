"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { orderKeys } from "./order-keys";
import { revisionKeys } from "./revision-keys";

type RequestRevisionArgs = {
  orderId: string;
  message: string;
  fileIds?: string[];
};

type RequestRevisionResult = {
  id: string;
  number: number;
  status: string;
  extraFeeRequired: boolean;
};

/** POST /api/orders/:id/revisions — the client files a revision request (plan 3 P5). */
export function useRequestRevision() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ orderId, message, fileIds }: RequestRevisionArgs): Promise<RequestRevisionResult> => {
      const result = await api<RequestRevisionResult>("post", {
        url: API_ROUTES.revisions(orderId),
        body: { message, fileIds: fileIds?.length ? fileIds : undefined },
      });
      return result.data as RequestRevisionResult;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
      void queryClient.invalidateQueries({ queryKey: revisionKeys.list(variables.orderId) });
      toast.success(
        data.extraFeeRequired
          ? "Revision requested. The designer will quote the extra fee before starting."
          : "Revision requested. We'll update the draft shortly.",
      );
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      requesting: mutation.isPending,
    },
    actions: {
      request: mutation.mutateAsync,
    },
    query: mutation,
  };
}
