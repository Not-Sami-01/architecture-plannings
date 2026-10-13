"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import type {
  CreatePortfolioProjectInput,
  UpdatePortfolioProjectInput,
} from "@/lib/validators/admin-portfolio";

import { portfolioKeys } from "./admin-portfolio-keys";
import type { AdminPortfolioRow } from "./use-admin-portfolio-projects";

function errorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE;
}

/** POST /api/admin/portfolio — create a project. */
export function useCreatePortfolioProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreatePortfolioProjectInput): Promise<AdminPortfolioRow> => {
      const result = await api<AdminPortfolioRow>("post", {
        url: API_ROUTES.adminPortfolio,
        body: input,
      });
      return result.data as AdminPortfolioRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
      toast.success("Project created.");
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

/** PATCH /api/admin/portfolio/:id — partial update. */
export function useUpdatePortfolioProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdatePortfolioProjectInput;
    }): Promise<AdminPortfolioRow> => {
      const result = await api<AdminPortfolioRow>("patch", {
        url: API_ROUTES.adminPortfolioItem(id),
        body: input,
      });
      return result.data as AdminPortfolioRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
      toast.success("Project saved.");
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

/** DELETE /api/admin/portfolio/:id — hard delete (purges gallery images). */
export function useDeletePortfolioProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await api<null>("delete", { url: API_ROUTES.adminPortfolioItem(id) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
      toast.success("Project deleted.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return {
    loadings: { deleting: mutation.isPending },
    actions: { remove: mutation.mutateAsync },
    query: mutation,
  };
}

/** POST /api/admin/portfolio/reorder — full set in display order. */
export function useReorderPortfolioProjects() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await api<{ count: number }>("post", {
        url: API_ROUTES.adminPortfolioReorder,
        body: { ids },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return {
    loadings: { reordering: mutation.isPending },
    actions: { reorder: mutation.mutateAsync },
    query: mutation,
  };
}
