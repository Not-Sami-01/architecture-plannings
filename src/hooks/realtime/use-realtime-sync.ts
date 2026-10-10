"use client";

import { Realtime } from "ably";
import type { TokenRequest } from "ably";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { API_ROUTES, REALTIME_CHANNELS } from "@/config/constants";
import { api } from "@/lib/api-client/api";
import { useSession } from "@/hooks/auth/use-session";

import { realtimeEventQueries } from "./realtime-queries";
import { realtimeKeys } from "./realtime-keys";

type TokenResponse = {
  enabled: boolean;
  tokenRequest: TokenRequest | null;
};

export type RealtimeConnection = "disabled" | "connecting" | "connected" | "offline";

/**
 * Pure connection-state derivation so the effect body never calls setState
 * (react-hooks/set-state-in-effect): listeners push socket events in, this
 * folds them with session/token state.
 */
export function deriveRealtimeConnection(input: {
  sessionLoading: boolean;
  userId: string | null;
  tokenReady: boolean;
  tokenEnabled: boolean;
  tokenError: boolean;
  /** Token the current client was created for. */
  currentToken: TokenRequest | null;
  /** Latest socket event; ignored when it belongs to an older token. */
  socket: { token: TokenRequest; state: string } | null;
}): RealtimeConnection {
  if (input.sessionLoading) return "connecting";
  if (!input.userId) return "disabled";
  if (!input.tokenReady) return input.tokenError ? "disabled" : "connecting";
  if (!input.tokenEnabled || !input.currentToken) return "disabled";
  if (!input.socket || input.socket.token !== input.currentToken) return "connecting";
  if (input.socket.state === "connected") return "connected";
  if (input.socket.state === "initialized" || input.socket.state === "connecting") {
    return "connecting";
  }
  return "offline";
}

/**
 * Subscribes to id-only realtime pings and invalidates the matching query
 * keys (RULES.md — components never touch TanStack directly). Realtime is
 * optional: no session, no key, or an auth failure all degrade to "disabled"
 * while the app keeps working through normal fetches.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const session = useSession();
  const userId = session.data?.id ?? null;
  const isAdmin = session.data?.role === "ADMIN";
  const [socket, setSocket] = useState<{
    token: TokenRequest;
    state: string;
  } | null>(null);

  const query = useQuery({
    queryKey: realtimeKeys.token(userId ?? "anonymous"),
    queryFn: async ({ signal }) => {
      const result = await api<TokenResponse>("post", {
        url: API_ROUTES.realtimeToken,
        signal,
        redirectOnAuth: false,
      });
      return result.data;
    },
    enabled: userId !== null,
    staleTime: 10 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    const token = query.data;
    if (!userId || !token?.enabled || !token.tokenRequest) return;

    const tokenRequest = token.tokenRequest;
    let disposed = false;
    const ably = new Realtime({
      clientId: userId,
      // Renewals need a fresh single-use TokenRequest every time.
      authCallback: (_params, callback) => {
        api<TokenResponse>("post", { url: API_ROUTES.realtimeToken, redirectOnAuth: false })
          .then((result) => {
            if (result.data.enabled && result.data.tokenRequest) {
              callback(null, result.data.tokenRequest);
            } else {
              callback("Realtime is not enabled.", null);
            }
          })
          .catch((error) =>
            callback(
              error instanceof Error ? error.message : "Realtime auth failed.",
              null,
            ),
          );
      },
    });

    const handlePing = (message: { data?: unknown }) => {
      const event = message.data;
      if (
        event === null ||
        typeof event !== "object" ||
        typeof (event as { type?: unknown }).type !== "string"
      ) {
        return;
      }
      const ping = event as { type: string; refId?: string };
      for (const queryKey of realtimeEventQueries(ping)) {
        void queryClient.invalidateQueries({ queryKey });
      }
    };

    const userChannel = ably.channels.get(REALTIME_CHANNELS.user(userId));
    userChannel.subscribe(REALTIME_CHANNELS.ping, handlePing);

    let adminChannel: ReturnType<typeof ably.channels.get> | null = null;
    if (isAdmin) {
      adminChannel = ably.channels.get(REALTIME_CHANNELS.admins);
      adminChannel.subscribe(REALTIME_CHANNELS.ping, handlePing);
    }

    // Async listener callbacks are the sanctioned way to mirror external
    // state into React (unlike setState in the effect body).
    const connectionListener = (stateChange: { current: string }) => {
      if (disposed) return;
      setSocket({ token: tokenRequest, state: stateChange.current });
    };
    ably.connection.on(connectionListener);

    return () => {
      disposed = true;
      userChannel.unsubscribe(REALTIME_CHANNELS.ping, handlePing);
      adminChannel?.unsubscribe(REALTIME_CHANNELS.ping, handlePing);
      ably.connection.off(connectionListener);
      ably.close();
    };
  }, [query.data, userId, isAdmin, queryClient]);

  const connection = deriveRealtimeConnection({
    sessionLoading: session.loadings.loading,
    userId,
    tokenReady: query.data !== undefined,
    tokenEnabled: query.data?.enabled === true,
    tokenError: query.isError,
    currentToken: query.data?.tokenRequest ?? null,
    socket,
  });

  return {
    data: { connection },
    loadings: {
      session: session.loadings.loading,
      token: userId !== null && query.isPending,
    },
    actions: {},
    query,
  };
}
