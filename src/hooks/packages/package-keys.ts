/** Query key factory for the packages feature (RULES.md §4). */
export const packageKeys = {
  all: ["packages"] as const,
  list: () => [...packageKeys.all, "list"] as const,
  adminList: () => [...packageKeys.all, "admin-list"] as const,
};
