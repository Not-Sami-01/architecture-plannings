"use client";

import { useSyncExternalStore } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { useUnreadMessages } from "@/hooks/messages/use-unread-messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageThread } from "@/components/messages/message-thread";

type CollapsibleChatProps = {
  orderId: string;
  allowInternal?: boolean;
};

/** localStorage is only for UI preferences like this open/closed flag (AGENTS.md). */
function storageKey(orderId: string) {
  return `archiplan-chat-open:${orderId}`;
}

function readStored(orderId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(storageKey(orderId));
    return stored === null ? true : stored === "1";
  } catch {
    return true;
  }
}

// Same-tab writes don't fire the `storage` event, so the store keeps its own
// listener set (mirrors the palette store in theme-provider.tsx).
const chatOpenListeners = new Set<() => void>();

function subscribeChatOpen(listener: () => void): () => void {
  chatOpenListeners.add(listener);
  return () => {
    chatOpenListeners.delete(listener);
  };
}

function emitChatOpenChange(): void {
  chatOpenListeners.forEach((listener) => listener());
}

/**
 * Collapsible chat for the proceed page (plan 2 P5). The thread unmounts when
 * collapsed, so it also pauses read receipts and focus stealing; the toggle
 * carries the unread badge.
 */
export function CollapsibleChat({ orderId, allowInternal = false }: CollapsibleChatProps) {
  const open = useSyncExternalStore(
    subscribeChatOpen,
    () => readStored(orderId),
    () => true,
  );
  // Only fetch the badge while collapsed — an open thread marks everything read.
  const unread = useUnreadMessages(orderId, !open);

  const toggle = () => {
    try {
      window.localStorage.setItem(storageKey(orderId), open ? "0" : "1");
    } catch {
      // Preference-only write; a blocked storage must never break the UI.
    }
    emitChatOpenChange();
  };

  return (
    <div className="flex flex-col rounded-xl border [&>section]:border-0">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Messages</h2>
          {!open && unread.data > 0 ? (
            <Badge className="px-1.5 text-[10px]" aria-label={`${unread.data} unread messages`}>
              {unread.data}
            </Badge>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          aria-expanded={open}
          aria-label={open ? "Collapse chat" : "Expand chat"}
        >
          {open ? (
            <ChevronUpIcon className="size-4" aria-hidden />
          ) : (
            <ChevronDownIcon className="size-4" aria-hidden />
          )}
        </Button>
      </div>

      {open ? <MessageThread orderId={orderId} allowInternal={allowInternal} hideHeader /> : null}
    </div>
  );
}
