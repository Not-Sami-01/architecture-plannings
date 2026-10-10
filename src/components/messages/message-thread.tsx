"use client";

import { useEffect, useRef } from "react";

import { useSession } from "@/hooks/auth/use-session";
import { useMessages } from "@/hooks/messages/use-messages";
import { useSendMessage } from "@/hooks/messages/use-send-message";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";

type MessageThreadProps = {
  orderId: string;
  /** Admins get the internal-note toggle; clients never do. */
  allowInternal?: boolean;
};

export function MessageThread({ orderId, allowInternal = false }: MessageThreadProps) {
  const session = useSession();
  const { data: messages, loadings, query: messagesQuery } = useMessages(orderId);
  const sendMessage = useSendMessage(orderId);
  const listRef = useRef<HTMLUListElement>(null);

  // Follow new messages the way a chat should (scroll container is the list).
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  if (loadings.loading) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border p-4" aria-busy>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-16 w-1/2 self-end" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  // A failed fetch must never masquerade as an empty thread.
  if (messagesQuery.isError) {
    return (
      <section aria-label="Messages" className="rounded-xl border p-4">
        <EmptyState
          title="Messages couldn't load"
          description="Something went wrong on our side. Please try again."
          action={
            <Button variant="outline" onClick={() => messagesQuery.refetch()}>
              Try again
            </Button>
          }
        />
      </section>
    );
  }

  return (
    <section aria-label="Messages" className="rounded-xl border">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Messages</h2>
        <p className="text-xs text-muted-foreground">
          Ask questions or share feedback about this order.
        </p>
      </header>

      {messages.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No messages yet"
            description="Start the conversation — we usually reply within a day."
          />
        </div>
      ) : (
        <ul
          ref={listRef}
          role="log"
          aria-live="polite"
          className="flex max-h-96 flex-col gap-4 overflow-y-auto p-4"
        >
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender.id === session.data?.id}
              showSender={allowInternal}
            />
          ))}
        </ul>
      )}

      <MessageInput
        sending={sendMessage.loadings.sending}
        allowInternal={allowInternal}
        onSend={(body, internal) => sendMessage.actions.send({ body, internal })}
      />
    </section>
  );
}
