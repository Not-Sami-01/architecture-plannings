"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { ROUTES } from "@/config/constants";
import type { AdminOrderDetail } from "@/hooks/orders/use-admin-order-detail";
import { useDeleteAdminOrder } from "@/hooks/orders/use-delete-admin-order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OrderDeleteControlsProps = {
  order: AdminOrderDetail;
};

/**
 * Hard delete (plan decision 1) — irreversible. Two-step confirm matching the
 * cancel pattern in status-controls: the exact order number must be retyped.
 */
export function OrderDeleteControls({ order }: OrderDeleteControlsProps) {
  const deleteOrder = useDeleteAdminOrder();
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [confirmText, setConfirmText] = useState("");

  const reset = () => {
    setStep(0);
    setConfirmText("");
  };

  const confirmDelete = async () => {
    try {
      await deleteOrder.actions.remove({ id: order.id });
      reset();
      router.push(ROUTES.admin.orders);
    } catch {
      // Toast shown by the hook.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" value={ROUTES.admin.orders} readOnly />
      {step === 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start text-destructive hover:text-destructive"
          onClick={() => setStep(1)}
        >
          <Trash2Icon className="size-4" aria-hidden />
          Delete order…
        </Button>
      ) : step === 1 ? (
        <>
          <p className="text-xs text-destructive">
            Deleting permanently removes the order, its files, messages, payments and history from
            storage. The client will see “Order not found”. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              Keep the order
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setStep(2)}
            >
              I understand, continue…
            </Button>
          </div>
        </>
      ) : (
        <>
          <Input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={`Type ${order.number} to confirm`}
            aria-label="Type the order number to confirm deletion"
            maxLength={20}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={confirmText !== order.number || deleteOrder.loadings.deleting}
              onClick={() => void confirmDelete()}
            >
              {deleteOrder.loadings.deleting ? "Deleting…" : `Delete ${order.number} forever`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
