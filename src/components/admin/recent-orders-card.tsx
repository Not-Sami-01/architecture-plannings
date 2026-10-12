"use client";

import Link from "next/link";

import { ROUTES } from "@/config/constants";
import { formatMoney } from "@/lib/format";
import { useAdminStats } from "@/hooks/admin/use-admin-stats";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/**
 * The ten most recent orders (plan 3 P7) — quick jump-off to order detail.
 */
export function RecentOrdersCard() {
  const { data: stats, loadings, query } = useAdminStats();

  if (loadings.loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Couldn&apos;t load recent orders.</span>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Recent orders</CardTitle>
        <Button variant="ghost" size="sm" render={<Link href={ROUTES.admin.orders} />}>
          View all
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No orders yet. New submissions appear here first.
          </p>
        ) : (
          stats.recentOrders.map((order) => (
            <Link
              key={order.id}
              href={ROUTES.admin.order(order.id)}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{order.number}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {order.clientName ?? order.clientEmail}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm tabular-nums text-muted-foreground">
                  {formatMoney(order.packagePrice, order.currency)}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
