"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OrderRevisionForm } from "@/components/orders/order-revision-form";

type RevisionRequestDialogProps = {
  /** Rendered as the trigger; usually the "Request revision" button. */
  trigger: React.ReactNode;
  orderId: string;
};

/** Dialog wrapper around the revision form (plan 3 P5). */
export function RevisionRequestDialog({ trigger, orderId }: RevisionRequestDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<>{trigger}</>} />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a revision</DialogTitle>
          <DialogDescription>
            Tell the designer what should change. You can attach up to 5 reference images.
          </DialogDescription>
        </DialogHeader>
        <OrderRevisionForm orderId={orderId} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
