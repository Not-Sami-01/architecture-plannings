"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { postKeys } from "./admin-post-keys";
import type { AdminPostRow } from "./use-admin-posts";

/** GET /api/admin/posts/:id — full record for the edit form. */
export function useAdminPost(id: string | null) {
  const query = useQuery({
    queryKey: postKeys.adminPost(id ?? ""),
    enabled: Boolean(id),
    queryFn: async ({ signal }) => {
      const result = await api<AdminPostRow>("get", {
        url: API_ROUTES.adminPost(id as string),
        signal,
      });
      return result.data as AdminPostRow;
    },
  });

  return {
    data: query.data ?? null,
    loadings: {
      loading: query.isPending,
    },
    actions: {},
    query,
  };
}
