"use client";

import { useState } from "react";

import { ORDER_STATUS_LABELS } from "@/config/constants";
import type { OrderStatus } from "@/config/constants";
import { allowedTransitions } from "@/lib/orders/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChangeStatus } from "@/hooks/orders/use-change-status";

type StatusControlsProps = {
  orderId: string;
  status: string;
};

/**
 * Admin status control: only transitions allowed by the status machine are
 * offered; the server re-validates and answers 409 on a stale selection.
 */
export function StatusControls({ orderId, status }: StatusControlsProps) {
  const { actions, loadings } = useChangeStatus();
  const [target, setTarget] = useState<OrderStatus | "">("");
  const [reason, setReason] = useState("");

  const options = allowedTransitions(status as OrderStatus);

  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        This order is closed — no further status changes.
      </p>
    );
  }

  const apply = async () => {
    if (!target) return;
    await actions.change({
      id: orderId,
      input: { to: target, reason: reason.trim() || undefined },
    });
    setTarget("");
    setReason("");
  };

  return (
    <div className="flex flex-col gap-2">
      <Select value={target} onValueChange={(value) => setTarget(value as OrderStatus)}>
        <SelectTrigger className="w-full" aria-label="New status">
          <SelectValue placeholder="Choose the next status…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {ORDER_STATUS_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason (optional, shows on the timeline)"
        maxLength={500}
        aria-label="Reason for the status change"
      />
      <Button
        type="button"
        size="sm"
        disabled={!target || loadings.changing}
        onClick={() => void apply()}
      >
        {loadings.changing ? "Applying…" : "Apply status"}
      </Button>
    </div>
  );
}
