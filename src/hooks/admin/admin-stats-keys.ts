/** Query key factory for the admin dashboard stats (plan 3). */
export const adminStatsKeys = {
  all: ["admin-stats"] as const,
  detail: () => [...adminStatsKeys.all, "detail"] as const,
};
