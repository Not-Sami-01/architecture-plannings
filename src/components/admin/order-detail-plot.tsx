import { formatMoney } from "@/lib/format";
import type { AdminOrderDetail } from "@/hooks/orders/use-admin-order-detail";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type OrderDetailPlotProps = {
  order: AdminOrderDetail;
};

/** Read-only presentation of FR-7/FR-8 answers (admin order detail, Phase 1.9). */
export function OrderDetailPlot({ order }: OrderDetailPlotProps) {
  const rows: { label: string; value: string }[] = [
    { label: "Plot", value: `${order.plotWidth} × ${order.plotLength} ${order.plotUnit}` },
    { label: "Facing", value: order.facing },
    { label: "Road sides", value: order.roadSides.join(", ") },
    { label: "City", value: order.city },
    { label: "Floors", value: String(order.floors) },
    { label: "Bedrooms", value: String(order.bedrooms) },
    { label: "Bathrooms", value: String(order.bathrooms) },
    { label: "Kitchen", value: order.kitchenType },
    { label: "Garage", value: order.garage ? "Yes" : "No" },
    { label: "Lounge", value: order.lounge ? "Yes" : "No" },
    { label: "Style", value: order.style },
    { label: "Budget", value: order.budget != null ? formatMoney(order.budget) : "Not stated" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Plot &amp; requirements</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col">
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
        {order.extras ? (
          <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Extra requirements</p>
            <p className="mt-1 whitespace-pre-wrap">{order.extras}</p>
          </div>
        ) : null}
        {order.notes ? (
          <div className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="mt-1 whitespace-pre-wrap">{order.notes}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
