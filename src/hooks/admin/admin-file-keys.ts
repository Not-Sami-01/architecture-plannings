/** Query key factory for the admin files feature (RULES.md §4). */
export const adminFileKeys = {
  all: ["admin-files"] as const,
  list: (filters: Record<string, unknown>) => [...adminFileKeys.all, "list", filters] as const,
};
