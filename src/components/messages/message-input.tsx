"use client";

import { useRef, useState } from "react";
import { FileIcon, XIcon } from "lucide-react";

import { formatBytes } from "@/lib/format";
import type { StagedFile, StagedRejection } from "@/lib/staged-files";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGES } from "@/config/constants";

type MessageInputProps = {
  /** Third argument carries the uploaded attachment ids (empty when none). */
  onSend: (body: string, internal: boolean, fileIds: string[]) => Promise<unknown> | void;
  sending: boolean;
  allowInternal?: boolean;
  /** Attachment staging (plan Phase B4); omit to keep a text-only input. */
  attachments?: {
    staged: StagedFile[];
    rejected: StagedRejection[];
    uploading: boolean;
    add: (files: readonly File[]) => void;
    remove: (key: string) => void;
    clear: () => void;
    uploadAll: () => Promise<string[]>;
  };
};

export function MessageInput({ onSend, sending, allowInternal = false, attachments }: MessageInputProps) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSend = body.trim().length > 0 && !sending && !(attachments?.uploading ?? false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    const trimmed = body.trim();
    setBody("");
    try {
      // Upload first (the server binds confirmed CHAT_ATTACHMENT files by id).
      const fileIds = attachments ? await attachments.uploadAll() : [];
      await onSend(trimmed, allowInternal && internal, fileIds);
      attachments?.clear();
    } catch {
      // The send hook already surfaced the error as a toast; restore the draft.
      setBody((current) => (current ? current : trimmed));
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 border-t p-3">
      {attachments && attachments.staged.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {attachments.staged.map((file) => (
            <li
              key={file.key}
              className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1 text-xs"
            >
              <FileIcon className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="max-w-36 truncate">{file.name}</span>
              <span className="text-muted-foreground">{formatBytes(file.size)}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => attachments.remove(file.key)}
              >
                <XIcon className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {attachments && attachments.rejected.length > 0 ? (
        <ul className="flex flex-col gap-0.5 text-xs text-destructive" aria-live="polite">
          {attachments.rejected.map((entry) => (
            <li key={`${entry.name}-${entry.reason}`}>
              {entry.name}: {entry.reason}
            </li>
          ))}
        </ul>
      ) : null}

      <label htmlFor="message-body" className="sr-only">
        Message
      </label>
      <Textarea
        id="message-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          // Ctrl/Cmd + Enter sends; plain Enter stays a newline.
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            if (canSend) event.currentTarget.form?.requestSubmit();
          }
        }}
        maxLength={MESSAGES.maxLength}
        rows={2}
        placeholder="Write a message… (Ctrl + Enter to send)"
        className="resize-none"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {attachments ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                aria-label="Attach files"
                onChange={(event) => {
                  if (event.target.files?.length) {
                    attachments.add(Array.from(event.target.files));
                    event.target.value = "";
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachments.uploading || attachments.staged.length >= 4}
              >
                {attachments.uploading ? "Uploading…" : "Attach"}
              </Button>
            </>
          ) : null}
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
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
            {body.length}/{MESSAGES.maxLength}
          </span>
          <Button type="submit" size="sm" disabled={!canSend}>
            {sending || attachments?.uploading ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </form>
  );
}
