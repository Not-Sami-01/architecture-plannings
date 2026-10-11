/** Query key factory for the admin users feature (RULES.md §4). */
export const adminUserKeys = {
  all: ["admin-users"] as const,
  list: (filters: Record<string, unknown>) => [...adminUserKeys.all, "list", filters] as const,
};
