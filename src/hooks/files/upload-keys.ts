/** Query key factory for the files feature (RULES.md §4). */
export const filesKeys = {
  all: ["files"] as const,
  mine: () => [...filesKeys.all, "mine"] as const,
  detail: (id: string) => [...filesKeys.all, "detail", id] as const,
};
