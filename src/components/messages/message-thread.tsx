"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/auth/use-session";
import { useMessages } from "@/hooks/messages/use-messages";
import { useSendMessage } from "@/hooks/messages/use-send-message";
import { useUpdateMessage } from "@/hooks/messages/use-update-message";
import { useDeleteMessage } from "@/hooks/messages/use-delete-message";
import { useChatAttachments } from "@/hooks/messages/use-chat-attachments";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MessageItem } from "@/hooks/messages/use-messages";
import { EmptyState } from "@/components/common/empty-state";

import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";

type MessageThreadProps = {
  orderId: string;
  /** Admins get the internal-note toggle; clients never do. */
  allowInternal?: boolean;
};

export function MessageThread({ orderId, allowInternal = false }: MessageThreadProps) {
  const session = useSession();
  const isAdmin = session.data?.role === "ADMIN";
  const { data: messages, loadings, query: messagesQuery } = useMessages(orderId);
  const sendMessage = useSendMessage(orderId);
  const updateMessage = useUpdateMessage(orderId);
  const deleteMessage = useDeleteMessage(orderId);
  const attachments = useChatAttachments(orderId, Boolean(isAdmin));
  const [editing, setEditing] = useState<MessageItem | null>(null);
  const [editBody, setEditBody] = useState("");
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

  const applyEdit = async () => {
    if (!editing) return;
    try {
      await updateMessage.actions.update({ messageId: editing.id, body: editBody.trim() });
      setEditing(null);
      setEditBody("");
    } catch {
      // Toast already shown by the hook.
    }
  };

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
          {messages.map((message) => {
            const isOwn = message.sender.id === session.data?.id;
            // Moderation: admins edit/delete any; clients edit/delete their own.
            const canModerate = Boolean(isAdmin) || (isOwn && !message.internal);
            const isEditing = editing?.id === message.id;

            return isEditing ? (
              <li key={message.id} className="flex flex-col gap-2 self-stretch">
                <textarea
                  value={editBody}
                  onChange={(event) => setEditBody(event.target.value)}
                  rows={2}
                  maxLength={2000}
                  autoFocus
                  aria-label="Edit message"
                  className="w-full rounded-xl border bg-background p-3 text-sm"
                />
                <div className="flex gap-2 self-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(null);
                      setEditBody("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" disabled={updateMessage.loadings.updating} onClick={() => void applyEdit()}>
                    {updateMessage.loadings.updating ? "Saving…" : "Save"}
                  </Button>
                </div>
              </li>
            ) : (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showSender={allowInternal}
                canModerate={canModerate}
                onEdit={(target) => {
                  setEditing(target);
                  setEditBody(target.body);
                }}
                onDelete={(target) => {
                  void deleteMessage.actions.remove({ messageId: target.id });
                }}
              />
            );
          })}
        </ul>
      )}

      <MessageInput
        sending={sendMessage.loadings.sending}
        allowInternal={allowInternal}
        onSend={(body, internal, fileIds) =>
          sendMessage.actions.send({ body, internal, fileIds })
        }
        attachments={{
          staged: attachments.data,
          rejected: attachments.query.rejected,
          uploading: attachments.loadings.uploading,
          add: (files) => attachments.actions.add(files),
          remove: (key) => attachments.actions.remove(key),
          clear: () => attachments.actions.clear(),
          uploadAll: async () => {
            await attachments.actions.uploadAll();
            return [];
          },
        }}
      />
    </section>
  );
}
