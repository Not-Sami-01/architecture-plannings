/** Query key factory for the payments feature (RULES.md §4). */
export const paymentKeys = {
  all: ["payments"] as const,
  list: (orderId: string) => [...paymentKeys.all, "list", orderId] as const,
};
