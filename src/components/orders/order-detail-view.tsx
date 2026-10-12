"use client";

import { AlertTriangleIcon } from "lucide-react";

import { useOrder } from "@/hooks/orders/use-order";
import { formatMoney } from "@/lib/format";
import { ORDER_STATUS_DETAIL, type OrderStatus } from "@/config/constants";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderActions } from "@/components/orders/order-actions";
import { OrderRevisionsCard } from "@/components/orders/order-revisions-card";
import { OrderDeliverables } from "@/components/orders/order-deliverables";
import { PaymentCard } from "@/components/payments/payment-card";
import { MessageThread } from "@/components/messages/message-thread";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type OrderDetailViewProps = {
  orderId: string;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  );
}

/** Read-only client detail for /dashboard/orders/[id] (ownership-checked server-side). */
export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const { data: order, loadings, query } = useOrder(orderId);

  if (loadings.loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    // Distinguish a real404 from a failed fetch — never blame the link for a server error.
    const status = (query.error as { status?: number } | null)?.status;
    const notFound = query.isError && status === 404;
    return (
      <div className="flex flex-col items-start gap-4">
        <Alert variant="destructive">
          <AlertTriangleIcon />
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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{order.number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {ORDER_STATUS_DETAIL[order.status as OrderStatus] ??
              "This order's status will update as work progresses."}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <OrderActions
        orderId={order.id}
        status={order.status}
        totalPrice={order.totalPrice}
        advancePercent={order.advancePercent}
        quoteMessage={order.quoteMessage}
        currency={order.currency}
      />

      {/* Renders nothing until the designer requests a charge (plan 2 P4). */}
      <PaymentCard orderId={order.id} currency={order.currency} />

      <Section title="Package">
        <Row label="Package" value={order.package.name} />
        <Row label="Included revisions" value={order.package.revisionLimit} />
      </Section>

      <Section title="Plot">
        <Row
          label="Size"
          value={`${order.plotWidth} × ${order.plotLength} ${order.plotUnit.toLowerCase()}`}
        />
        <Row
          label="Facing"
          value={order.facing.charAt(0) + order.facing.slice(1).toLowerCase()}
        />
        <Row
          label="Road sides"
          value={
            order.roadSides
              .map((side) => side.charAt(0) + side.slice(1).toLowerCase())
              .join(", ") || "—"
          }
        />
        <Row label="City" value={order.city || "—"} />
      </Section>

      <Section title="Requirements">
        <Row label="Floors" value={order.floors} />
        <Row label="Bedrooms" value={order.bedrooms} />
        <Row label="Bathrooms" value={order.bathrooms} />
        <Row
          label="Kitchen"
          value={order.kitchenType.charAt(0) + order.kitchenType.slice(1).toLowerCase()}
        />
        <Row
          label="Garage / Lounge"
          value={`${order.garage ? "Yes" : "No"} / ${order.lounge ? "Yes" : "No"}`}
        />
        {order.extras ? <Row label="Extras" value={order.extras} /> : null}
      </Section>

      <Section title="Style & notes">
        <Row
          label="Style"
          value={order.style.charAt(0) + order.style.slice(1).toLowerCase().replace(/_/g, " ")}
        />
        {order.budget ? (
          <Row label="Budget" value={formatMoney(order.budget, order.currency)} />
        ) : null}
        {order.notes ? <Row label="Notes" value={order.notes} /> : null}
      </Section>      <OrderDeliverables order={order} />

      <OrderRevisionsCard order={order} />

      <MessageThread orderId={order.id} />
    </div>
  );
}
