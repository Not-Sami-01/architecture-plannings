import { APP } from "@/config/constants";
import { Badge } from "@/components/ui/badge";

type OrderCardMockProps = {
  /** Free revisions shown on the card (from the featured package). */
  revisions?: number;
};

/**
 * Decorative order-card visual for the home hero: a mini floor plan with the
 * order number, plot facts and status badges. Purely presentational.
 */
export function OrderCardMock({ revisions }: OrderCardMockProps) {
  return (
    <div
      className="rounded-2xl border bg-card p-4 shadow-sm"
      aria-hidden
      role="presentation"
    >
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        <span>
          Order {APP.orderNumberPrefix}-2026-0042
        </span>
        <span>30 × 60 ft · North</span>
      </div>

      <div className="mt-4 grid grid-cols-3 grid-rows-3 gap-2">
        <div className="col-span-1 row-span-2 flex items-center justify-center rounded-lg border bg-muted/40 p-2 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Lounge
        </div>
        <div className="flex items-center justify-center rounded-lg border bg-muted/40 p-2 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Kitchen
        </div>
        <div className="flex items-center justify-center rounded-lg border bg-muted/40 p-2 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Dining
        </div>
        <div className="flex items-center justify-center rounded-lg border bg-muted/40 p-2 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Bed 1
        </div>
        <div className="flex items-center justify-center rounded-lg border bg-muted/40 p-2 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Bath
        </div>
        <div className="col-span-2 flex items-center justify-center rounded-lg border bg-muted/40 p-2 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Garage
        </div>
        <div className="flex items-center justify-center rounded-lg border bg-muted/40 p-2 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Lawn
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Badge variant="secondary">Draft ready</Badge>
        {revisions ? <Badge variant="secondary">{revisions} revisions free</Badge> : null}
      </div>
    </div>
  );
}
