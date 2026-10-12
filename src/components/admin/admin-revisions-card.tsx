"use client";

import { useState } from "react";

import {
  ORDER_STATUSES,
  PAYMENT_TYPES,
  REVISION_STATUSES,
} from "@/config/constants";
import { formatMoney } from "@/lib/format";
import { useAdminAcceptRevision } from "@/hooks/orders/use-admin-accept-revision";
import { useAdminCreatePayment } from "@/hooks/payments/use-admin-create-payment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminRevisionsCardProps = {
  orderId: string;
  currency: string;
  /** The order's package list price, for prefilling the extra-revision charge. */
  packagePrice: number;
  orderStatus: string;
  revisions: {
    id: string;
    number: number;
    status: string;
    message: string;
    extraFeeRequired: boolean;
    extraFeePaid?: boolean;
    acceptedAt: string | null;
    createdAt: string;
    files: { id: string; filename: string; mime: string; size: number }[];
  }[];
};

/**
 * Admin revision queue (plan 3 P6): every revision with its extra-fee state.
 * An unpaid extra-fee revision disables Accept and offers the charge dialog
 * prefill (EXTRA_REVISION) — acknowledgement is blocked until it is PAID.
 */
export function AdminRevisionsCard({
  orderId,
  currency,
  packagePrice,
  orderStatus,
  revisions,
}: AdminRevisionsCardProps) {
  const accept = useAdminAcceptRevision();
  const createPayment = useAdminCreatePayment(orderId);
  const [chargingFor, setChargingFor] = useState<string | null>(null);

  const acceptingId =
    accept.loadings.accepting && typeof accept.query.variables === "string"
      ? accept.query.variables
      : undefined;
  const creating = createPayment.loadings.creating;

  /** Charge the extra revision fee (plan decision 1): admin-quoted amount. */
  const chargeExtra = async () => {
    try {
      await createPayment.actions.create({
        amount: packagePrice,
        type: PAYMENT_TYPES.EXTRA_REVISION,
        note: "Extra revision fee — quoted before the revision is accepted.",
      });
      setChargingFor(null);
    } catch {
      // Toast already shown by the hook.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revisions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No revision requests on this order yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {revisions.map((revision) => {
              const isBlocked =
                revision.extraFeeRequired && revision.extraFeePaid !== true;
              const isAccepting = acceptingId === revision.id;

              return (
                <li key={revision.id} className="flex flex-col gap-2 rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">Revision #{revision.number}</span>
                    <div className="flex items-center gap-2">
                      {revision.extraFeeRequired ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Extra fee {isBlocked ? "unpaid" : "paid"}
                        </Badge>
                      ) : null}
                      <Badge
                        variant={
                          revision.status === REVISION_STATUSES.DONE ? "default" : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {revision.status === REVISION_STATUSES.DONE ? "Handled" : "Open"}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{revision.message}</p>

                  {revision.files.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {revision.files.length} reference file
                      {revision.files.length === 1 ? "" : "s"} attached
                    </span>
                  ) : null}

                  {revision.status === REVISION_STATUSES.OPEN &&
                  orderStatus === ORDER_STATUSES.REVISION_REQUESTED ? (
                    <div className="flex flex-wrap gap-2">
                      {isBlocked && chargingFor !== revision.id ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setChargingFor(revision.id)}
                        >
                          Charge extra revision
                        </Button>
                      ) : null}
                      {isBlocked && chargingFor === revision.id ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={creating}
                            onClick={() => void chargeExtra()}
                          >
                            {creating
                              ? "Charging…"
                              : `Charge ${formatMoney(packagePrice, currency)}`}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setChargingFor(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : null}
                      <Button
                        size="sm"
                        disabled={isBlocked || isAccepting}
                        title={
                          isBlocked
                            ? "The extra revision charge must be paid first."
                            : undefined
                        }
                        onClick={() =>
                          void accept.actions.accept(revision.id).catch(() => undefined)
                        }
                      >
                        {isAccepting ? "Accepting…" : "Accept revision"}
                      </Button>
                    </div>
                  ) : null}

                  <span className="text-xs text-muted-foreground">
                    {new Date(revision.createdAt).toLocaleString()}
                    {revision.acceptedAt
                      ? ` · accepted ${new Date(revision.acceptedAt).toLocaleDateString()}`
                      : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
