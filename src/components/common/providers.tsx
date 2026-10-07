"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

import { publicConfig } from "@/config/public-config";

/**
 * The single TanStack Query provider (RULES.md §8). Defaults are decided here:
 * - staleTime 60s: avoids refetch storms across dashboard navigation.
 * - retries 1: API errors are surfaced through toasts, not silent spinners.
 * - no refetchOnWindowFocus: order status changes arrive via explicit refetch.
 * Hooks override only when they have a reason.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {publicConfig.isDev ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      ) : null}
    </QueryClientProvider>
  );
}
