import Link from "next/link";

import { ROUTES } from "@/config/constants";
import { MessageThread } from "@/components/messages/message-thread";

/** Full thread view for /admin/chats/[orderId], with edit/delete controls on. */
export function AdminChatThreadView({ orderId }: { orderId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href={ROUTES.admin.chats}
        className="w-fit text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to chats
      </Link>
      <div className="mx-auto w-full max-w-3xl">
        <MessageThread orderId={orderId} allowInternal />
      </div>
    </div>
  );
}
