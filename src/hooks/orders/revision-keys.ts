/** Query key factory for the revisions feature (RULES.md §4). */
export const revisionKeys = {
  all: ["revisions"] as const,
  list: (orderId: string) => [...revisionKeys.all, "list", orderId] as const,
};
