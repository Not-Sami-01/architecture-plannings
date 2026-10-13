/** Query key factory for the blog feature (RULES.md §4). */
export const postKeys = {
  all: ["posts"] as const,
  list: () => [...postKeys.all, "list"] as const,
  adminList: (filters?: unknown) =>
    [...postKeys.all, "admin-list", filters ?? {}] as const,
  adminPost: (id: string) => [...postKeys.all, "admin-post", id] as const,
};
