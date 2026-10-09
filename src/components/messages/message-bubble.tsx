import { Badge } from "@/components/ui/badge";

import type { MessageItem } from "@/hooks/messages/use-messages";

type MessageBubbleProps = {
  message: MessageItem;
  isOwn: boolean;
  /** Sender name is useful in the admin thread; clients only ever see themselves. */
  showSender: boolean;
};

export function MessageBubble({ message, isOwn, showSender }: MessageBubbleProps) {
  const senderLabel =
    message.sender.name ?? (isOwn ? "You" : message.sender.role === "ADMIN" ? "Designer" : "Client");

  return (
    <li
      className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
      aria-label={`Message from ${senderLabel}`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {showSender ? <span className="font-medium">{senderLabel}</span> : null}
        <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
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
    </li>
  );
}
