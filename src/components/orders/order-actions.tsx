"use client";

import { ORDER_STATUSES } from "@/config/constants";
import { formatMoney } from "@/lib/format";
import { useAcceptQuote } from "@/hooks/orders/use-accept-quote";
import { useApproveDraft } from "@/hooks/orders/use-approve-draft";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrderActionsProps = {
  orderId: string;
  status: string;
  totalPrice: number | null;
  advancePercent: number;
  quoteMessage: string | null;
};

/**
 * Client quote summary + the two client-side status actions (PRD §4):
 * accept the quote (QUOTED) and approve the draft (DRAFT_DELIVERED).
 */
export function OrderActions({
  orderId,
  status,
  totalPrice,
  advancePercent,
  quoteMessage,
}: OrderActionsProps) {
  const { actions: acceptActions, loadings: acceptLoadings } = useAcceptQuote();
  const { actions: approveActions, loadings: approveLoadings } = useApproveDraft();

  const quote =
    totalPrice != null
      ? { total: totalPrice, advance: Math.round((totalPrice * advancePercent) / 100) }
      : null;

  // Guidance-only states (no action button yet — payments land in a later phase).
  const guidance: Partial<Record<string, string>> = {
    [ORDER_STATUSES.AWAITING_ADVANCE]:
      "Your quote is confirmed. Pay the advance invoice to move your order into design.",
    [ORDER_STATUSES.IN_DESIGN]:
      "We're designing your plan now. You'll see a watermarked draft here when it's ready.",
    [ORDER_STATUSES.REVISION_REQUESTED]:
      "We've received your revision notes and are updating the draft. We'll re-deliver it here.",
    [ORDER_STATUSES.AWAITING_FINAL_PAYMENT]:
      "Your draft is approved. Settle the final balance to receive the full-resolution files.",
  };

  if (!quote && status !== ORDER_STATUSES.DRAFT_DELIVERED && !guidance[status]) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Next step</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {quote ? (
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Total price</dt>
              <dd className="font-medium">{formatMoney(quote.total)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Advance ({advancePercent}%)</dt>
              <dd className="font-medium">{formatMoney(quote.advance)}</dd>
            </div>
            {quoteMessage ? (
              <p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                {quoteMessage}
              </p>
            ) : null}
          </dl>
        ) : null}

        {status === ORDER_STATUSES.QUOTED ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Accept the quote to confirm your order; the advance payment comes next.
            </p>
            <Button
              type="button"
              disabled={acceptLoadings.accepting}
              onClick={() => acceptActions.accept(orderId).catch(() => undefined)}
            >
              {acceptLoadings.accepting ? "Accepting…" : "Accept quote"}
            </Button>
          </div>
        ) : null}

        {status === ORDER_STATUSES.DRAFT_DELIVERED ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Happy with the draft? Approve it to move to final payment and unlock the full files.
            </p>
            <Button
              type="button"
              disabled={approveLoadings.approving}
              onClick={() => approveActions.approve(orderId).catch(() => undefined)}
            >
              {approveLoadings.approving ? "Approving…" : "Approve draft"}
            </Button>
          </div>
        ) : null}

        {guidance[status] ? (
          <p className="text-sm text-muted-foreground">{guidance[status]}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
