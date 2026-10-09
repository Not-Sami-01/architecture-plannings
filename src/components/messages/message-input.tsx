"use client";

import { useState } from "react";

import { MESSAGES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MessageInputProps = {
  /** May resolve with the created message; the thread only cares that it settled. */
  onSend: (body: string, internal: boolean) => Promise<unknown> | void;
  sending: boolean;
  allowInternal?: boolean;
};

export function MessageInput({ onSend, sending, allowInternal = false }: MessageInputProps) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const canSend = body.trim().length > 0 && !sending;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    const trimmed = body.trim();
    setBody("");
    try {
      await onSend(trimmed, allowInternal && internal);
    } catch {
      // The send hook already surfaced the error as a toast; restore the draft.
      setBody((current) => (current ? current : trimmed));
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 border-t p-3">
      <label htmlFor="message-body" className="sr-only">
        Message
      </label>
      <Textarea
        id="message-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={MESSAGES.maxLength}
        rows={2}
        placeholder="Write a message…"
        className="resize-none"
      />
      <div className="flex items-center justify-between gap-2">
        {allowInternal ? (
          <Button
            type="button"
            variant={internal ? "default" : "ghost"}
            size="sm"
            onClick={() => setInternal((value) => !value)}
            aria-pressed={internal}
          >
            {internal ? "Internal note" : "Client-visible"}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {body.length}/{MESSAGES.maxLength}
          </span>
        )}
        <Button type="submit" size="sm" disabled={!canSend}>
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  );
}
