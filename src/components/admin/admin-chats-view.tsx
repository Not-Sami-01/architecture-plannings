"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquareIcon, SearchIcon } from "lucide-react";

import { ROUTES } from "@/config/constants";
import { useAdminThreads } from "@/hooks/admin/use-admin-threads";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 20;

export function AdminChatsView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: threads, loadings, query } = useAdminThreads({
    q: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Chats" description="Orders with an active conversation." />

      <div className="relative min-w-56 flex-1">
        <SearchIcon
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search order number or client…"
          className="pl-9"
          aria-label="Search threads"
        />
      </div>

      {loadings.loading ? (
        <div className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState
          title="Chats couldn't load"
          description="Something went wrong on our side. Please try again."
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
        />
      ) : threads.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Threads appear here as soon as a client or you send the first message on an order."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={ROUTES.admin.chat(thread.id)}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{thread.number}</span>
                    <OrderStatusBadge status={thread.status} />
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {thread.client.name ?? thread.client.email}
                    {thread.lastMessagePreview
                      ? ` · ${thread.lastMessagePreview}`
                      : " (attachments only)"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquareIcon className="size-3.5" aria-hidden />
                    {thread.messageCount}
                  </span>
                  {thread.lastMessageAt ? (
                    <span>{new Date(thread.lastMessageAt).toLocaleString()}</span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={threads.length < PAGE_SIZE}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
