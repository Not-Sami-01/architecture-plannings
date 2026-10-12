"use client";

import { ImageIcon } from "lucide-react";

import { ORDER_STATUSES, REVISION_STATUSES } from "@/config/constants";
import { API_ROUTES } from "@/config/constants";
import { formatBytes } from "@/lib/format";
import type { ClientOrderDetail } from "@/hooks/orders/use-order";
import { RevisionRequestDialog } from "@/components/orders/revision-request-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrderRevisionsCardProps = {
  order: ClientOrderDetail;
};

function RevisionRow({ revision }: { revision: ClientOrderDetail["revisions"][number] }) {
  const isDone = revision.status === REVISION_STATUSES.DONE;
  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">Revision #{revision.number}</span>
        <div className="flex items-center gap-2">
          {revision.extraFeeRequired ? (
            <Badge variant="secondary" className="text-[10px]">
              Extra fee quoted
            </Badge>
          ) : null}
          <Badge variant={isDone ? "default" : "secondary"} className="text-[10px]">
            {isDone ? "Delivered" : "Requested"}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{revision.message}</p>
      {revision.files.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {revision.files.map((file) => (
            <li key={file.id}>
              <a
                href={API_ROUTES.fileDownload(file.id)}
                className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1 text-xs transition-colors hover:bg-muted"
              >
                <ImageIcon className="size-3.5 text-muted-foreground" aria-hidden />
                <span className="max-w-40 truncate">{file.filename}</span>
                <span className="text-muted-foreground">{formatBytes(file.size)}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <span className="text-xs text-muted-foreground">
        {new Date(revision.createdAt).toLocaleString()}
        {revision.acceptedAt
          ? ` · accepted ${new Date(revision.acceptedAt).toLocaleDateString()}`
          : ""}
      </span>
    </li>
  );
}

/**
 * Revision history + the request entry point (plan 3 P5). Clients can file
 * revisions only while the draft is delivered; the card otherwise explains.
 */
export function OrderRevisionsCard({ order }: OrderRevisionsCardProps) {
  const canRequest = order.status === ORDER_STATUSES.DRAFT_DELIVERED;
  const freeLeft = Math.max(0, order.package.revisionLimit - order.revisionCount);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Revisions</CardTitle>
          <span className="text-xs text-muted-foreground">
            {freeLeft > 0
              ? `${freeLeft} of ${order.package.revisionLimit} free revisions left`
              : "No free revisions left — further revisions are quoted by the designer first"}
          </span>
        </div>
        {canRequest ? (
          <RevisionRequestDialog
            orderId={order.id}
            trigger={<Button size="sm">Request revision</Button>}
          />
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {order.revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {canRequest
              ? "Not happy with something? Request a revision with notes and reference images."
              : "Revision requests appear here once a draft has been delivered."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {order.revisions.map((revision) => (
              <RevisionRow key={revision.id} revision={revision} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
