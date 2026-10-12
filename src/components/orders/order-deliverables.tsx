"use client";

import { FileCheckIcon } from "lucide-react";

import { API_ROUTES, ORDER_STATUSES } from "@/config/constants";
import { formatBytes } from "@/lib/format";
import type { ClientOrderDetail } from "@/hooks/orders/use-order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";

type OrderDeliverablesProps = {
  order: ClientOrderDetail;
};

const KIND_LABELS: Record<string, string> = {
  CLIENT: "Your upload",
  DRAFT_PREVIEW: "Draft preview",
  REVISION_REF: "Revision note",
  FINAL: "Final drawing",
};

/**
 * Status-aware deliverables (plan Phase D5). What appears is decided
 * server-side in getOrderForUser; this section only labels and downloads.
 */
export function OrderDeliverables({ order }: OrderDeliverablesProps) {
  const drafts = order.files.filter((file) => file.kind !== "CLIENT");
  const clientFiles = order.files.filter((file) => file.kind === "CLIENT");

  const finalLocked =
    (order.status === ORDER_STATUSES.AWAITING_FINAL_PAYMENT ||
      order.status === ORDER_STATUSES.DRAFT_DELIVERED) &&
    !drafts.some((file) => file.kind === "FINAL");

  // Empty-state copy that matches where the order actually is — never tell a
  // client "coming soon" about something they already have access to.
  const waitingCopy = (() => {
    switch (order.status) {
      case ORDER_STATUSES.SUBMITTED:
        return {
          title: "Nothing to download yet",
          description: "Files appear here once your quote is accepted and the draft is delivered.",
        };
      case ORDER_STATUSES.QUOTED:
        return {
          title: "Nothing to download yet",
          description: "Accept the quote and pay the advance — your draft lands here.",
        };
      case ORDER_STATUSES.AWAITING_ADVANCE:
        return {
          title: "Nothing to download yet",
          description: "Pay the advance and we start designing; the draft is delivered here.",
        };
      case ORDER_STATUSES.IN_DESIGN:
        return {
          title: "Your draft is being prepared",
          description: "We'll notify you here as soon as the draft drawings are ready to review.",
        };
      default:
        return {
          title: "Drafts will appear here",
          description:
            "Once a draft is delivered you can preview and download it from this section.",
        };
    }
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCheckIcon className="size-4" aria-hidden />
          Deliverables
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {drafts.length === 0 ? (
          finalLocked ? (
            <EmptyState
              icon={FileCheckIcon}
              title="Finals unlock after the final payment"
              description="Complete the final payment to download your finished drawing set."
            />
          ) : (
            <EmptyState icon={FileCheckIcon} {...waitingCopy} />
          )
        ) : (
          <ul className="divide-y rounded-lg border">
            {drafts.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{file.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{KIND_LABELS[file.kind] ?? file.kind}</Badge>
                  <a
                    href={API_ROUTES.fileDownload(file.id)}
                    className="shrink-0 text-sm underline-offset-4 hover:underline"
                  >
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}

        {drafts.length > 0 && finalLocked ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            The final drawing set unlocks after the final payment is verified.
          </p>
        ) : null}

        {clientFiles.length > 0 ? (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Your uploaded files</p>
            <ul className="divide-y rounded-lg border">
              {clientFiles.map((file) => (
                <li key={file.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <a
                    href={API_ROUTES.fileDownload(file.id)}
                    className="shrink-0 text-sm underline-offset-4 hover:underline"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
