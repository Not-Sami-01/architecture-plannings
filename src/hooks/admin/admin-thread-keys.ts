/** Query key factory for the admin threads feature (RULES.md §4). */
export const adminThreadKeys = {
  all: ["admin-threads"] as const,
  list: (filters: Record<string, unknown>) => [...adminThreadKeys.all, "list", filters] as const,
};
