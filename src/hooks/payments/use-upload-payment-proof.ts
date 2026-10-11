"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import { uploadToStorage } from "@/lib/api-client/upload";
import { orderKeys } from "@/hooks/orders/order-keys";

import { paymentKeys } from "./payment-keys";
import type { PaymentSummary } from "./use-order-payments";

type UploadProofArgs = { paymentId: string; file: File };

/**
 * Client uploads a transfer proof (plan 2 P4): presign PAYMENT_PROOF with the
 * orderId → PUT → confirm → bind to the payment in one hook action.
 */
export function useUploadPaymentProof(orderId: string) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ paymentId, file }: UploadProofArgs): Promise<PaymentSummary> => {
      setUploading(true);
      try {
        const uploaded = await uploadToStorage({
          file,
          kind: "PAYMENT_PROOF",
          orderId,
          isAdmin: false,
        });
        const result = await api<PaymentSummary>("post", {
          url: API_ROUTES.paymentProof(paymentId),
          body: { fileId: uploaded.id },
        });
        return result.data as PaymentSummary;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.list(orderId) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      toast.success("Proof sent — the designer will verify it shortly.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      uploading: uploading || mutation.isPending,
    },
    actions: {
      uploadProof: mutation.mutateAsync,
    },
    query: mutation,
  };
}
