"use client";

import { BadgeCheckIcon, FileIcon, XIcon } from "lucide-react";

import {
  API_ROUTES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
} from "@/config/constants";
import { formatBytes, formatMoney } from "@/lib/format";
import { useOrderPayments } from "@/hooks/payments/use-order-payments";
import { useAdminVerifyPayment } from "@/hooks/payments/use-admin-verify-payment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AdminPaymentsListProps = {
  orderId: string;
};

/**
 * Proceed-page charges (plan 2 P4): every payment of the order with its proof
 * and verify/reject controls while one is still pending.
 */
export function AdminPaymentsList({ orderId }: AdminPaymentsListProps) {
  const payments = useOrderPayments(orderId);
  const verify = useAdminVerifyPayment(orderId);

  if (payments.loadings.loading) {
    return (
      <div className="flex flex-col gap-2" aria-busy>
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (payments.query.isError) {
    return (
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">Payments couldn&apos;t load.</span>
        <Button variant="outline" size="sm" onClick={() => payments.query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (payments.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No charges yet — use <span className="font-medium text-foreground">Proceed → Charge user</span>{" "}
        to request a payment.
      </p>
    );
  }

  const verifyingId = verify.loadings.verifying ? verify.query.variables?.paymentId : undefined;

  return (
    <ul className="flex flex-col gap-3">
      {payments.data.map((payment) => {
        const label = PAYMENT_TYPE_LABELS[payment.type];
        return (
          <li key={payment.id} className="rounded-xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{label}</span>
                <Badge
                  variant={
                    payment.status === "PAID"
                      ? "default"
                      : payment.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-[10px]"
                >
                  {PAYMENT_STATUS_LABELS[payment.status]}
                </Badge>
              </div>
              <span className="text-base font-semibold tabular-nums">
                {formatMoney(payment.amount)}
              </span>
            </div>

            {payment.note ? (
              <p className="mt-1.5 text-xs text-muted-foreground">{payment.note}</p>
            ) : null}

            {payment.proofFile ? (
              <a
                href={API_ROUTES.fileDownload(payment.proofFile.id)}
                className="mt-2 flex w-fit items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
              >
                <FileIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="max-w-44 truncate font-medium">{payment.proofFile.filename}</span>
                <span className="text-muted-foreground">
                  {formatBytes(payment.proofFile.size)}
                </span>
              </a>
            ) : payment.status === "PENDING" ? (
              <p className="mt-2 text-xs text-muted-foreground">Waiting for the client&apos;s proof…</p>
            ) : null}

            {payment.status === "PENDING" ? (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={verifyingId === payment.id}
                  onClick={() =>
                    void verify.actions
                      .verify({ paymentId: payment.id, input: { status: "PAID" } })
                      .catch(() => {
                        // Toast already shown by the hook.
                      })
                  }
                >
                  <BadgeCheckIcon className="size-4" aria-hidden />
                  {verifyingId === payment.id ? "Saving…" : "Mark verified"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={verifyingId === payment.id}
                  onClick={() =>
                    void verify.actions
                      .verify({ paymentId: payment.id, input: { status: "REJECTED" } })
                      .catch(() => {
                        // Toast already shown by the hook.
                      })
                  }
                >
                  <XIcon className="size-4" aria-hidden />
                  Reject
                </Button>
              </div>
            ) : null}

            {payment.status === "PAID" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Verified {new Date(payment.updatedAt).toLocaleString()}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
