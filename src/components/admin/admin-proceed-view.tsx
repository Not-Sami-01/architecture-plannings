"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { ROUTES, type OrderStatus } from "@/config/constants";
import { formatMoney } from "@/lib/format";
import { useAdminOrderDetail } from "@/hooks/orders/use-admin-order-detail";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { AdminPaymentsList } from "@/components/admin/admin-payments-list";
import { AdminRevisionsCard } from "@/components/admin/admin-revisions-card";
import {
  DeliverDraftDialog,
  RegisterFinalsDialog,
} from "@/components/admin/deliver-draft-dialog";
import { OrderDetailTimeline } from "@/components/admin/order-detail-timeline";
import { OrderDetailPlot } from "@/components/admin/order-detail-plot";
import { OrderDetailUploads } from "@/components/admin/order-detail-uploads";
import { ProceedDialog } from "@/components/admin/proceed-dialog";
import { StatusControls } from "@/components/admin/status-controls";
import { CollapsibleChat } from "@/components/messages/collapsible-chat";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AdminProceedViewProps = {
  orderId: string;
};

/**
 * The proceed workspace (plan 2 P5): one focused page to move an order
 * forward — drop deliverable files, charge the client, change status, and a
 * collapsible chat with read receipts.
 */
export function AdminProceedView({ orderId }: AdminProceedViewProps) {
  const { data: order, loadings, query } = useAdminOrderDetail(orderId);

  if (loadings.loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    const status = (query.error as { status?: number } | null)?.status;
    const notFound = query.isError && status === 404;
    return (
      <div className="flex flex-col items-start gap-4">
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>{notFound ? "Order not found" : "Couldn't load this order"}</AlertTitle>
          <AlertDescription>
            {notFound
              ? "It may have been removed, or the link is wrong."
              : "Something went wrong on our side. Please try again."}
          </AlertDescription>
        </Alert>
        {!notFound ? (
          <Button onClick={() => query.refetch()}>Try again</Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={ROUTES.admin.order(order.id)}
        className="w-fit text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to order detail
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Proceed {order.number}
          </h1>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {order.user.name ?? "No name"} · {order.user.email} · {order.package.name} ·{" "}
            {formatMoney(order.package.price, order.currency)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {order.status === "IN_DESIGN" ? (
            <DeliverDraftDialog order={order} />
          ) : null}
          <RegisterFinalsDialog order={order} />
          <ProceedDialog
            orderId={order.id}
            packagePrice={order.package.price}
            currency={order.currency}
            status={order.status as OrderStatus}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Change status</p>
            <div className="mt-2">
              <StatusControls orderId={order.id} status={order.status} />
            </div>
          </section>

          <section className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Charges</p>
            <div className="mt-3">
              <AdminPaymentsList orderId={order.id} currency={order.currency} />
            </div>
          </section>

          <section className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Revisions</p>
            <div className="mt-3">
              <AdminRevisionsCard
                orderId={order.id}
                currency={order.currency}
                packagePrice={order.package.price}
                orderStatus={order.status}
                revisions={order.revisions}
              />
            </div>
          </section>

          {/* The client's brief — the answers the designer works from (FR-7/FR-8). */}
          <OrderDetailPlot order={order} title="Project information" />

          <OrderDetailUploads files={order.files} orderId={order.id} />
          <OrderDetailTimeline events={order.events} />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <CollapsibleChat orderId={order.id} allowInternal />
          </div>
        </div>
      </div>
    </div>
  );
}
