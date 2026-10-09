"use client";

import { AlertTriangleIcon } from "lucide-react";

import { API_ROUTES } from "@/config/constants";
import { useOrder } from "@/hooks/orders/use-order";
import { formatBytes, formatMoney } from "@/lib/format";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderActions } from "@/components/orders/order-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const { data: order, loadings } = useOrder(orderId);

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
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>Order not found</AlertTitle>
        <AlertDescription>
          It may have been removed, or the link is wrong.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{order.number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {new Date(order.createdAt).toLocaleDateString()}
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
      />

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
        {order.budget ? <Row label="Budget" value={formatMoney(order.budget)} /> : null}
        {order.notes ? <Row label="Notes" value={order.notes} /> : null}
      </Section>

      <Section title={`Your files (${order.files.length})`}>
        {order.files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files attached.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {order.files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-3 p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{file.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.mime} · {formatBytes(file.size)}
                  </p>
                </div>
                <a
                  href={API_ROUTES.fileDownload(file.id)}
                  className="shrink-0 text-sm underline-offset-4 hover:underline"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
