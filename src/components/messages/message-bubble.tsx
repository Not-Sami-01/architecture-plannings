"use client";

import { CheckCheckIcon, FileIcon } from "lucide-react";

import { API_ROUTES } from "@/config/constants";
import { formatBytes } from "@/lib/format";
import { formatMessageTime } from "@/lib/format-message-time";
import type { MessageItem } from "@/hooks/messages/use-messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type MessageBubbleProps = {
  message: MessageItem;
  isOwn: boolean;
  /**
   * For own messages: the counterpart's read receipt (plan 2 P3). Null when
   * the other side has not opened the thread yet.
   */
  seenBy: { readAt: string } | null;
  /** Edit/delete controls (per moderation permissions, plan B3). */
  canModerate: boolean;
  onEdit: (message: MessageItem) => void;
  onDelete: (message: MessageItem) => void;
  /** Delete is in flight for this message — disable its button. */
  deleting?: boolean;
};

export function MessageBubble({
  message,
  isOwn,
  seenBy,
  canModerate,
  onEdit,
  onDelete,
  deleting = false,
}: MessageBubbleProps) {
  // Locked labels (plan 2): own → "You", admins always get the "(Admin)" mark.
  const senderLabel = isOwn
    ? "You"
    : message.sender.role === "ADMIN"
      ? `${message.sender.name ?? "Designer"} (Admin)`
      : (message.sender.name ?? "Client");

  const time = formatMessageTime(message.createdAt);
  const seenTime = seenBy ? formatMessageTime(seenBy.readAt) : null;

  const tooltipLines = [
    time.full,
    seenTime ? `Seen · ${seenTime.full}` : isOwn ? "Not seen yet" : null,
    message.editedAt ? `Edited ${formatMessageTime(message.editedAt).full}` : null,
  ].filter((line): line is string => Boolean(line));

  return (
    <li
      className={`group flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
      aria-label={`Message from ${senderLabel}`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">{senderLabel}</span>
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="cursor-default underline decoration-dotted underline-offset-2">
                <time dateTime={message.createdAt}>{time.short}</time>
                {message.editedAt ? <span className="italic"> (edited)</span> : null}
                {isOwn ? (
                  <CheckCheckIcon
                    aria-label={seenBy ? "Seen by the other side" : "Not seen yet"}
                    className={`ml-1 inline size-3.5 -translate-y-px ${
                      seenBy ? "text-primary" : "text-muted-foreground/50"
                    }`}
                  />
                ) : null}
              </span>
            }
          />
          <TooltipContent>
            <span className="flex flex-col gap-0.5">
              {tooltipLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </span>
          </TooltipContent>
        </Tooltip>
        {message.internal ? (
          <Badge variant="secondary" className="text-[10px] uppercase">
            Internal
          </Badge>
        ) : null}
      </div>

      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {message.body}
      </div>

      {message.attachments.length > 0 ? (
        <ul className="flex max-w-[85%] flex-col gap-1">
          {message.attachments.map((attachment) => (
            <li key={attachment.id}>
              <a
                href={API_ROUTES.fileDownload(attachment.id)}
                className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
              >
                <FileIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="max-w-40 truncate font-medium">{attachment.filename}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatBytes(attachment.size)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {canModerate && !deleting ? (
        <div
          className={`flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 ${
            isOwn ? "flex-row-reverse" : ""
          }`}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onEdit(message)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => onDelete(message)}
          >
            Delete
          </Button>
        </div>
      ) : deleting ? (
        <span className="text-xs text-muted-foreground">Deleting…</span>
      ) : null}
    </li>
  );
}
