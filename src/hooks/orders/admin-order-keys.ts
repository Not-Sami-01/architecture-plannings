/** Query key factory for the admin orders feature (RULES.md §4). */
export const adminOrderKeys = {
  all: ["admin-orders"] as const,
  list: (filters: Record<string, unknown>) => [...adminOrderKeys.all, "list", filters] as const,
  detail: (id: string) => [...adminOrderKeys.all, "detail", id] as const,
};
