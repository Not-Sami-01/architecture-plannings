import type { AdminEventRow } from "@/hooks/orders/use-admin-order-detail";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/config/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";

type OrderDetailTimelineProps = {
  events: AdminEventRow[];
};

function label(status: string | null): string {
  if (!status) return "—";
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function OrderDetailTimeline({ events }: OrderDetailTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState title="No events yet" description="Status changes will appear here." />
        ) : (
          <ol className="space-y-4">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3 text-sm">
                <span
                  aria-hidden
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                />
                <div>
                  <p className="font-medium">
                    {label(event.fromStatus)} → {label(event.toStatus)}
                  </p>
                  {event.note ? <p className="text-muted-foreground">{event.note}</p> : null}
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
