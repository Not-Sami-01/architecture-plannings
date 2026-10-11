"use client";

import { CheckIcon, Undo2Icon } from "lucide-react";

import { useTakeOrder } from "@/hooks/orders/use-take-order";
import { Button } from "@/components/ui/button";

type OrderTakeControlsProps = {
  orderId: string;
  assignedTo: { id: string; name: string | null; email: string } | null;
  currentAdminId: string;
};

/** Take/release an order (plan Phase D1). Not a status change. */
export function OrderTakeControls({ orderId, assignedTo, currentAdminId }: OrderTakeControlsProps) {
  const take = useTakeOrder();
  const isMine = assignedTo?.id === currentAdminId;

  if (isMine) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={take.loadings.taking}
        onClick={() => void take.actions.take({ id: orderId, take: false })}
      >
        <Undo2Icon className="size-4" aria-hidden />
        Release this order
      </Button>
    );
  }

  if (assignedTo) {
    return (
      <p className="text-xs text-muted-foreground">
        Taken by {assignedTo.name ?? assignedTo.email}
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={take.loadings.taking}
      onClick={() => void take.actions.take({ id: orderId, take: true })}
    >
      <CheckIcon className="size-4" aria-hidden />
      {take.loadings.taking ? "Taking…" : "Take this order"}
    </Button>
  );
}
