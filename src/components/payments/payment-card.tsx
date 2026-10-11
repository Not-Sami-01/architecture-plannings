"use client";

import { useRef } from "react";
import { BadgeCheckIcon, FileIcon, UploadIcon, XIcon } from "lucide-react";

import {
  API_ROUTES,
  FILE_LIMITS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
} from "@/config/constants";
import { formatBytes, formatMoney } from "@/lib/format";
import { useOrderPayments, type PaymentSummary } from "@/hooks/payments/use-order-payments";
import { useUploadPaymentProof } from "@/hooks/payments/use-upload-payment-proof";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type PaymentCardProps = {
  orderId: string;
};

function StatusDot({ status }: { status: PaymentSummary["status"] }) {
  const tone =
    status === "PAID"
      ? "bg-emerald-500"
      : status === "REJECTED"
        ? "bg-destructive"
        : "bg-amber-500";
  return <span aria-hidden className={`size-2 shrink-0 rounded-full ${tone}`} />;
}

/**
 * Client "payment due" card (plan 2 P4): shows the designer's charge, lets the
 * client upload a transfer proof, and reflects the verification state live.
 * Renders nothing while the order has no payments.
 */
export function PaymentCard({ orderId }: PaymentCardProps) {
  const payments = useOrderPayments(orderId);
  const proofUpload = useUploadPaymentProof(orderId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPaymentId = proofUpload.query.variables?.paymentId;

  if (payments.loadings.loading) {
    return (
      <Card aria-busy>
        <CardHeader>
          <CardTitle className="text-base">Payment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (payments.query.isError || payments.data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {payments.data.map((payment) => {
          const label = PAYMENT_TYPE_LABELS[payment.type];
          const isThisUploading = proofUpload.loadings.uploading && pendingPaymentId === payment.id;
          return (
            <div key={payment.id} className="rounded-xl border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusDot status={payment.status} />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </span>
                </div>
                <span className="text-base font-semibold tabular-nums">
                  {formatMoney(payment.amount)}
                </span>
              </div>

              {payment.note ? (
                <p className="mt-2 text-sm text-muted-foreground">{payment.note}</p>
              ) : null}

              {payment.status === "PENDING" && !payment.proofFile ? (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">
                    Pay by bank transfer, then upload the receipt or screenshot (JPG, PNG or
                    PDF, up to {formatBytes(FILE_LIMITS.clientMaxSizeBytes)}).
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="sr-only"
                      aria-label="Payment proof file"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void proofUpload.actions
                            .uploadProof({ paymentId: payment.id, file })
                            .catch(() => {
                              // Toast already shown by the hook.
                            });
                        }
                        event.target.value = "";
                      }}
                    />
                    <Button
                      size="sm"
                      disabled={proofUpload.loadings.uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadIcon className="size-4" aria-hidden />
                      {isThisUploading ? "Uploading…" : "Upload payment proof"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {payment.proofFile ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <a
                    href={API_ROUTES.fileDownload(payment.proofFile.id)}
                    className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1 transition-colors hover:bg-muted"
                  >
                    <FileIcon className="size-3.5" aria-hidden />
                    {payment.proofFile.filename}
                    <span>({formatBytes(payment.proofFile.size)})</span>
                  </a>
                  {payment.status === "PENDING" ? (
                    <span>Waiting for the designer to verify.</span>
                  ) : null}
                </div>
              ) : null}

              {payment.status === "PAID" ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <BadgeCheckIcon className="size-3.5" aria-hidden />
                  Verified {new Date(payment.updatedAt).toLocaleDateString()}
                </p>
              ) : null}

              {payment.status === "REJECTED" ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                  <XIcon className="size-3.5" aria-hidden />
                  The designer couldn&apos;t accept this proof.
                </p>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
