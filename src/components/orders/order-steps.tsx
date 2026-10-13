import { CheckIcon } from "lucide-react";

import { ORDER_STATUS_DETAIL, ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/config/constants";
import type { OrderStatus } from "@/config/constants";
import { cn } from "cn";

/**
 * The client-facing main path (plan 5 D): submitted → quote → advance →
 * design → draft → final payment → completed. The revision loop folds back
 * onto the draft step; CANCELLED replaces the tracker with a note.
 */
export const ORDER_TRACKING_STEPS: readonly OrderStatus[] = [
  ORDER_STATUSES.SUBMITTED,
  ORDER_STATUSES.QUOTED,
  ORDER_STATUSES.AWAITING_ADVANCE,
  ORDER_STATUSES.IN_DESIGN,
  ORDER_STATUSES.DRAFT_DELIVERED,
  ORDER_STATUSES.AWAITING_FINAL_PAYMENT,
  ORDER_STATUSES.COMPLETED,
];

/**
 * Which tracker step a status lights up (pure, unit-tested):
 * the revision loop sits on the draft step (work is being redone there).
 */
export function trackingStepIndex(status: string): number {
  const effective =
    status === ORDER_STATUSES.REVISION_REQUESTED ? ORDER_STATUSES.DRAFT_DELIVERED : status;
  const index = ORDER_TRACKING_STEPS.indexOf(effective as OrderStatus);
  // Unknown/legacy statuses light nothing — the header badge still shows them.
  return index;
}

type OrderStepsProps = {
  status: string;
};

/**
 * Numbered status tracker for the order detail page: hairline rows, vertical
 * on small screens and a horizontal rail above 767px.
 */
export function OrderSteps({ status }: OrderStepsProps) {
  if (status === ORDER_STATUSES.CANCELLED) {
    return (
      <section aria-label="Order progress" className="rounded-lg border bg-card">
        <div className="border-t px-4 py-3">
          <p className="font-medium">This order was cancelled</p>
          <p className="mt-1 text-sm text-muted-foreground">{ORDER_STATUS_DETAIL.CANCELLED}</p>
        </div>
      </section>
    );
  }

  const currentIndex = trackingStepIndex(status);

  return (
    <section aria-label="Order progress" className="rounded-lg border bg-card">
      <ol className="flex flex-col md:flex-row">
        {ORDER_TRACKING_STEPS.map((step, index) => {
          const done = currentIndex >= 0 && index < currentIndex;
          const current = index === currentIndex;
          const stepStatus: OrderStatus =
            current && status === ORDER_STATUSES.REVISION_REQUESTED
              ? ORDER_STATUSES.REVISION_REQUESTED
              : step;
          return (
            <li
              key={step}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-start gap-3 border-t px-4 py-3 md:min-w-0 md:flex-1 md:flex-col md:gap-1.5",
                index === 0 && "md:border-t-0",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary text-primary",
                  !done && !current && "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {done ? <CheckIcon className="size-3.5" /> : index + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    !done && !current && "text-muted-foreground",
                  )}
                >
                  {current && status === ORDER_STATUSES.REVISION_REQUESTED
                    ? "In revision"
                    : ORDER_STATUS_LABELS[step]}
                </span>
                {current ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {ORDER_STATUS_DETAIL[stepStatus]}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
