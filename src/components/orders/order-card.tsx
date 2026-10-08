"use client";

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { ROUTES } from "@/config/constants";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { OrderListItem } from "@/hooks/orders/use-orders";

type OrderCardProps = {
  order: OrderListItem;
};

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link
      href={ROUTES.dashboardOrder(order.id)}
      className="group flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-primary"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold tracking-tight">{order.number}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {order.package.name}
          {order.city ? ` · ${order.city}` : ""}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Submitted {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>
      <ChevronRightIcon
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
