"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import type { VerifyPaymentInput } from "@/lib/validators/payments";
import { adminOrderKeys } from "@/hooks/orders/admin-order-keys";

import { paymentKeys } from "./payment-keys";
import type { PaymentSummary } from "./use-order-payments";

type VerifyPaymentArgs = { paymentId: string; input: VerifyPaymentInput };

/** PATCH /api/admin/payments/:id — verify (PAID) or reject a charge. */
export function useAdminVerifyPayment(orderId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ paymentId, input }: VerifyPaymentArgs): Promise<PaymentSummary> => {
      const result = await api<PaymentSummary>("patch", {
        url: API_ROUTES.adminPayment(paymentId),
        body: input,
      });
      return result.data as PaymentSummary;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.list(orderId) });
      void queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      toast.success(
        variables.input.status === "PAID"
          ? "Payment marked as verified."
          : "Payment rejected.",
      );
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      verifying: mutation.isPending,
    },
    actions: {
      verify: mutation.mutateAsync,
    },
    query: mutation,
  };
}
