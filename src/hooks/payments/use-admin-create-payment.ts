"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import type { CreatePaymentInput } from "@/lib/validators/payments";
import { adminOrderKeys } from "@/hooks/orders/admin-order-keys";

import { paymentKeys } from "./payment-keys";
import type { PaymentSummary } from "./use-order-payments";

/** POST /api/admin/orders/:id/charge — admin creates a payment request. */
export function useAdminCreatePayment(orderId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreatePaymentInput): Promise<PaymentSummary> => {
      const result = await api<PaymentSummary>("post", {
        url: API_ROUTES.adminOrderPayments(orderId),
        body: input,
      });
      return result.data as PaymentSummary;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.list(orderId) });
      void queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      toast.success("Charge sent to the client.");
    },
    onError: (error) => {
      // A 409 usually means a pending charge already exists — refresh state.
      if (error instanceof ApiClientError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: paymentKeys.list(orderId) });
      }
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      creating: mutation.isPending,
    },
    actions: {
      create: mutation.mutateAsync,
    },
    query: mutation,
  };
}
