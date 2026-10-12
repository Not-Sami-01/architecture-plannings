"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { settingsKeys } from "./settings-keys";

/** PATCH /api/admin/settings — admin updates the site currency (plan 3 P8). */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: { currency: string }) => {
      await api("patch", { url: API_ROUTES.adminSettings, body: input });
    },
    onSuccess: () => {
      // Every open tab refetches settings via the `settings.updated` ping;
      // this invalidation makes the saving tab instant.
      void queryClient.invalidateQueries({ queryKey: settingsKeys.detail() });
      toast.success("Currency updated. Amounts are relabelled, never converted.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      saving: mutation.isPending,
    },
    actions: {
      save: mutation.mutateAsync,
    },
    query: mutation,
  };
}
