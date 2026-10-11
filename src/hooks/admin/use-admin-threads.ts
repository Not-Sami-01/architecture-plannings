"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { adminThreadKeys } from "./admin-thread-keys";

export type AdminThreadRow = {
  id: string;
  number: string;
  status: string;
  client: { id: string; name: string | null; email: string };
  messageCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastSenderRole: "CLIENT" | "ADMIN" | null;
};

/** GET /api/admin/threads — orders with messages, newest activity first. */
export function useAdminThreads(filters: { q?: string; page: number; pageSize: number }) {
  const query = useQuery({
    queryKey: adminThreadKeys.list(filters),
    queryFn: async ({ signal }) => {
      const result = await api<AdminThreadRow[]>("get", {
        url: API_ROUTES.adminThreads,
        params: {
          ...(filters.q ? { q: filters.q } : {}),
          page: filters.page,
          pageSize: filters.pageSize,
        },
        signal,
      });
      return result.data ?? [];
    },
    placeholderData: (previous) => previous,
  });

  return {
    data: query.data ?? [],
    loadings: {
      loading: query.isPending,
      fetching: query.isFetching,
    },
    actions: {},
    query,
  };
}
