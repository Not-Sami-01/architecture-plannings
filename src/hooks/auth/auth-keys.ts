/** Query key factory for the auth feature (RULES.md §4). */
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
};
