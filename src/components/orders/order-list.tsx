"use client";

import Link from "next/link";
import { InboxIcon } from "lucide-react";

import { ROUTES } from "@/config/constants";
import { useOrders } from "@/hooks/orders/use-orders";
import { OrderCard } from "@/components/orders/order-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** The client's orders on /dashboard: loading skeleton, empty state, list. */
export function OrderList() {
  const { data, loadings, query } = useOrders();

  if (loadings.loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        <Skeleton className="h-24 w-full" />
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
    return (
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
    <ul className="flex flex-col gap-3">
      {data.map((order) => (
        <li key={order.id}>
          <OrderCard order={order} />
        </li>
      ))}
    </ul>
  );
}
