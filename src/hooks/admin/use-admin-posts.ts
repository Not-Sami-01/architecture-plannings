"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";
import type { PostListQuery } from "@/lib/validators/admin-posts";

import { postKeys } from "./admin-post-keys";

export type AdminPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  readingMinutes: number;
  publishedAt: string | null;
  updatedAt: string;
  coverImageId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  contentHtml: string;
  author: { name: string | null };
};

export type AdminPostsFilters = Partial<Omit<PostListQuery, "page" | "pageSize">> & {
  page: number;
  pageSize: number;
};

/** GET /api/admin/posts — filtered, paginated admin list. */
export function useAdminPosts(filters: AdminPostsFilters) {
  const query = useQuery({
    queryKey: postKeys.adminList(filters),
    queryFn: async ({ signal }) => {
      const result = await api<AdminPostRow[]>("get", {
        url: API_ROUTES.adminPosts,
        params: {
          ...(filters.q ? { q: filters.q } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          page: filters.page,
          pageSize: filters.pageSize,
        },
        signal,
      });
      const meta = (result as { meta?: { total: number } }).meta;
      return { items: result.data ?? [], total: meta?.total ?? 0 };
    },
    placeholderData: (previous) => previous,
  });

  return {
    data: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    loadings: {
      loading: query.isPending,
      fetching: query.isFetching,
    },
    actions: {},
    query,
  };
}
