"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InboxIcon, PackageSearchIcon, XIcon } from "lucide-react";

import { ORDER_STATUSES, ORDER_STATUS_LABELS, ROUTES } from "@/config/constants";
import type { OrderStatus } from "@/config/constants";
import { useOrders } from "@/hooks/orders/use-orders";
import { OrderCard } from "@/components/orders/order-card";
import { OrdersPager } from "@/components/admin/orders-pager";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * The client's orders on /dashboard: debounced search, status filter, sort
 * and a pager — the client-side counterpart of the admin orders view (FR-29
 * covers the admin table; this mirrors its query shape for the dashboard).
 * Filter state is local: the dashboard is a private list, so URL params
 * (which the admin view uses for shareable links) would add round-trips
 * without helping anyone here.
 */
export function OrderList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  // Debounce the free-text search; changing any filter resets paging.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, meta, loadings, query } = useOrders({
    q: debouncedSearch || undefined,
    status: status || undefined,
    sort,
    page,
  });

  const anyFilter = Boolean(debouncedSearch || status || sort !== "newest");

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setSort("newest");
    setPage(1);
  };

  if (loadings.loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-full sm:w-64" />
          <Skeleton className="h-10 w-full sm:w-48" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (query.isError) {
    // A failed fetch is not the same as "no orders yet" — never lie about state.
    return (
      <EmptyState
        title="Couldn't load your orders"
        description="Something went wrong on our side. Please try again."
        action={
          <Button variant="outline" onClick={() => query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (data.length === 0) {
    return anyFilter ? (
      <EmptyState
        icon={PackageSearchIcon}
        title="No orders match these filters"
        description="Try a different search or clear the filters."
        action={
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={InboxIcon}
        title="No orders yet"
        description="Start your first house design order and track it here."
        action={
          <Button render={<Link href={ROUTES.newOrder} />}>Start an order</Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex flex-wrap items-center gap-3 ${
          loadings.fetching ? "opacity-60 transition-opacity" : ""
        }`}
        aria-busy={loadings.fetching}
      >
        <Input
          type="search"
          placeholder="Search number, city, package…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:w-64"
          aria-label="Search your orders"
        />
        <Select
          value={status || "all"}
          onValueChange={(value) => {
            setStatus(value === "all" ? "" : (value as OrderStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.values(ORDER_STATUSES) as OrderStatus[]).map((option) => (
              <SelectItem key={option} value={option}>
                {ORDER_STATUS_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value === "oldest" ? "oldest" : "newest");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40" aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
        {anyFilter ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1.5"
          >
            <XIcon className="size-3.5" aria-hidden />
            Clear
          </Button>
        ) : null}
      </div>

      <ul
        className={`flex flex-col gap-3 ${
          loadings.fetching ? "opacity-60 transition-opacity" : ""
        }`}
      >
        {data.map((order) => (
          <li key={order.id}>
            <OrderCard order={order} />
          </li>
        ))}
      </ul>

      <OrdersPager meta={meta} onPageChange={setPage} />
    </div>
  );
}
