/** Query key factory for the portfolio feature (RULES.md §4). */
export const portfolioKeys = {
  all: ["portfolio"] as const,
  list: (filters?: unknown) => [...portfolioKeys.all, "list", filters ?? {}] as const,
  adminList: () => [...portfolioKeys.all, "admin-list"] as const,
  adminProject: (id: string) => [...portfolioKeys.all, "admin-project", id] as const,
};
