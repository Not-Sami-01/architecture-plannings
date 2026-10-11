"use client";

import { useState } from "react";
import { ArrowLeftIcon, CreditCardIcon, UploadIcon } from "lucide-react";

import type { OrderStatus } from "@/config/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ProceedChargeForm } from "./proceed-charge-form";
import { ProceedDropFiles } from "./proceed-drop-files";

type ProceedDialogProps = {
  orderId: string;
  packagePrice: number;
  status: OrderStatus;
};

type ProceedView = "menu" | "drop" | "charge";

/**
 * The "Proceed" hub (plan 2 P5): one button opens the options — drop deliverable
 * files or charge the client — without leaving the order context.
 */
export function ProceedDialog({ orderId, packagePrice, status }: ProceedDialogProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ProceedView>("menu");

  const close = () => {
    setOpen(false);
    // Reset after close so the next open always starts at the menu.
    setView("menu");
  };

  const titles: Record<ProceedView, string> = {
    menu: "Proceed with this order",
    drop: "Drop files",
    charge: "Charge the client",
  };

  return (
    <>
      <Button
        size="lg"
        onClick={() => {
          setView("menu");
          setOpen(true);
        }}
      >
        Proceed
      </Button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(next) : close())}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            {view !== "menu" ? (
              <button
                type="button"
                className="w-fit text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setView("menu")}
              >
                <ArrowLeftIcon className="mr-1 inline size-3" aria-hidden />
                Back to options
              </button>
            ) : null}
            <DialogTitle>{titles[view]}</DialogTitle>
            {view === "menu" ? (
              <DialogDescription>
                Move this order forward — deliver files or request a payment.
              </DialogDescription>
            ) : null}
          </DialogHeader>

          {view === "menu" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setView("drop")}
                className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="rounded-lg border bg-muted p-2">
                  <UploadIcon className="size-4" aria-hidden />
                </span>
                <span className="font-medium">Drop files</span>
                <span className="text-xs text-muted-foreground">
                  Upload drafts, finals or reference drawings for the client.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setView("charge")}
                className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="rounded-lg border bg-muted p-2">
                  <CreditCardIcon className="size-4" aria-hidden />
                </span>
                <span className="font-medium">Charge user</span>
                <span className="text-xs text-muted-foreground">
                  Request an advance, final or extra amount from the client.
                </span>
              </button>
            </div>
          ) : null}

          {view === "drop" ? (
            <ProceedDropFiles
              orderId={orderId}
              onUploaded={() => {
                close();
              }}
            />
          ) : null}

          {view === "charge" ? (
            <ProceedChargeForm
              orderId={orderId}
              packagePrice={packagePrice}
              status={status}
              onDone={close}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
