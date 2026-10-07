"use client";

import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { DEFAULT_ERROR_MESSAGE, ERROR_CODES, ROUTES } from "@/config/constants";
import { ApiClientError } from "@/lib/api-client/api";
import type { LoginInput } from "@/lib/validators/auth";

/**
 * POST /api/auth/callback/credentials via Auth.js client (`signIn`).
 * Auth.js owns this endpoint (CSRF-protected); the axios `api` util cannot
 * replicate its flow, so this hook wraps `signIn` directly (RULES.md §3
 * exception, documented in API.md).
 */
export function useLogin() {
  const mutation = useMutation({
    mutationFn: async (input: LoginInput): Promise<{ next: string }> => {
      const result = await signIn("credentials", {
        email: input.email,
        password: input.password,
        redirect: false,
      });

      if (result?.error) {
        throw new ApiClientError(401, "Wrong email or password.", ERROR_CODES.UNAUTHENTICATED);
      }

      return { next: ROUTES.dashboard };
    },
    onSuccess: () => {
      toast.success("Welcome back!");
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      loggingIn: mutation.isPending,
    },
    actions: {
      login: mutation.mutateAsync,
    },
    query: mutation,
  };
}
