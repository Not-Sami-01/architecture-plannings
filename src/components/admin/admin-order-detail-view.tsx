"use client";

import { AlertTriangle } from "lucide-react";

import { formatMoney } from "@/lib/format";
import { useAdminOrderDetail } from "@/hooks/orders/use-admin-order-detail";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderDetailPlot } from "@/components/admin/order-detail-plot";
import { OrderDetailTimeline } from "@/components/admin/order-detail-timeline";
import { OrderDetailUploads } from "@/components/admin/order-detail-uploads";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type AdminOrderDetailViewProps = {
  orderId: string;
};

export function AdminOrderDetailView({ orderId }: AdminOrderDetailViewProps) {
  const { data: order, loadings } = useAdminOrderDetail(orderId);

  if (loadings.loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Order not found</AlertTitle>
        <AlertDescription>It may have been removed, or the link is wrong.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{order.number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.user.name ?? "No name"} · {order.user.email} · submitted{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-4 text-sm md:col-span-1">
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Package</p>
            <p className="font-medium">{order.package.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              List price {formatMoney(order.package.price)} · {order.package.revisionLimit} free
              revisions
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Quote</p>
            <p className="font-medium">
              {order.totalPrice != null
                ? `${formatMoney(order.totalPrice)} · ${order.advancePercent}% advance`
                : "Not quoted yet (Phase 2)"}
            </p>
            {order.quoteMessage ? (
              <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                {order.quoteMessage}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Revisions</p>
            <p className="font-medium">
              {order.revisionCount} used of {order.package.revisionLimit} free
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:col-span-2">
          <OrderDetailPlot order={order} />
          <OrderDetailUploads files={order.files} />
          <OrderDetailTimeline events={order.events} />
        </div>
      </div>
    </div>
  );
}
