/** Query key factory for the realtime feature (RULES.md §4). */
export const realtimeKeys = {
  all: ["realtime"] as const,
  token: (userId: string) => [...realtimeKeys.all, "token", userId] as const,
};
