/** Query key factory for the orders feature (RULES.md §4). */
export const orderKeys = {
  all: ["orders"] as const,
  // Filters are part of the key (one cached entry per filter/page combo);
  // invalidate orderKeys.all to refresh every list at once.
  list: (filters?: Record<string, unknown>) =>
    filters ? ([...orderKeys.all, "list", filters] as const) : ([...orderKeys.all, "list"] as const),
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};
