/** Query key factory for the messages feature (RULES.md §4). */
export const messageKeys = {
  all: ["messages"] as const,
  list: (orderId: string) => [...messageKeys.all, "list", orderId] as const,
};
