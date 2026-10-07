"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";
import type { RegisterInput } from "@/lib/validators/auth";

import { authKeys } from "./auth-keys";

type RegisterResponse = { id: string; email: string };

/** POST /api/auth/register — creates the client account. */
export function useRegister() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: RegisterInput): Promise<RegisterResponse> => {
      const result = await api<RegisterResponse>("post", {
        url: API_ROUTES.auth.register,
        body: input,
      });
      return result.data as RegisterResponse;
    },
    onSuccess: (user) => {
      queryClient.setQueryData([...authKeys.all, "registered"], user);
      toast.success("Account created. Signing you in…");
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      creating: mutation.isPending,
    },
    actions: {
      register: mutation.mutateAsync,
    },
    query: mutation,
  };
}
