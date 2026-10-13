"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import type {
  CreatePostInput,
  UpdatePostInput,
} from "@/lib/validators/admin-posts";

import { postKeys } from "./admin-post-keys";
import type { AdminPostRow } from "./use-admin-posts";

function errorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE;
}

/** POST /api/admin/posts — creates a draft. */
export function useCreatePost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreatePostInput): Promise<AdminPostRow> => {
      const result = await api<AdminPostRow>("post", {
        url: API_ROUTES.adminPosts,
        body: input,
      });
      return result.data as AdminPostRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return {
    data: mutation.data,
    loadings: { creating: mutation.isPending },
    actions: { create: mutation.mutateAsync },
    query: mutation,
  };
}

/** PATCH /api/admin/posts/:id — partial update. */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdatePostInput;
    }): Promise<AdminPostRow> => {
      const result = await api<AdminPostRow>("patch", {
        url: API_ROUTES.adminPost(id),
        body: input,
      });
      return result.data as AdminPostRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return {
    data: mutation.data,
    loadings: { updating: mutation.isPending },
    actions: { update: mutation.mutateAsync },
    query: mutation,
  };
}

/** POST /api/admin/posts/:id/publish — publish or unpublish. */
export function usePublishPost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      publish,
    }: {
      id: string;
      publish: boolean;
    }): Promise<AdminPostRow> => {
      const result = await api<AdminPostRow>("post", {
        url: API_ROUTES.adminPostPublish(id),
        body: { publish },
      });
      return result.data as AdminPostRow;
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      toast.success(post.status === "PUBLISHED" ? "Post published." : "Post unpublished.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return {
    data: mutation.data,
    loadings: { publishing: mutation.isPending },
    actions: { publish: mutation.mutateAsync },
    query: mutation,
  };
}

/** DELETE /api/admin/posts/:id — hard delete. */
export function useDeletePost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await api<null>("delete", { url: API_ROUTES.adminPost(id) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      toast.success("Post deleted.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return {
    loadings: { deleting: mutation.isPending },
    actions: { remove: mutation.mutateAsync },
    query: mutation,
  };
}
