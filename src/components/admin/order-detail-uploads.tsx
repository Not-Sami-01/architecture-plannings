"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon, Trash2Icon } from "lucide-react";

import { formatBytes } from "@/lib/format";
import { API_ROUTES } from "@/config/constants";
import type { AdminOrderDetail } from "@/hooks/orders/use-admin-order-detail";
import { adminOrderKeys } from "@/hooks/orders/admin-order-keys";
import { useDeleteAdminFile } from "@/hooks/admin/use-delete-admin-file";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { OrderUploadControls } from "@/components/admin/order-upload-controls";

type OrderDetailUploadsProps = {
  files: AdminOrderDetail["files"];
  orderId: string;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

/**
 * Uploads card of the admin order detail (plan 5 C): staged uploads, a
 * "Seen by client" badge driven by OrderFile.seenAt, and per-file delete
 * behind a two-step confirm.
 */
export function OrderDetailUploads({ files, orderId }: OrderDetailUploadsProps) {
  const queryClient = useQueryClient();
  const deleteFile = useDeleteAdminFile();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const confirmDelete = async (id: string) => {
    try {
      await deleteFile.actions.remove({ id });
      setPendingDeleteId(null);
      await queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(orderId) });
    } catch {
      // Toast shown by the hook.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Uploads ({files.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <OrderUploadControls orderId={orderId} />
        {files.length === 0 ? (
          <EmptyState
            title="No files yet"
            description="Client uploads and your drafts/finals all appear here."
          />
        ) : (
          <ul className="divide-y rounded-lg border">
            {files.map((file) => {
              const deleting = pendingDeleteId === file.id;
              return (
                <li key={file.id} className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.mime} · {formatBytes(file.size)} · {formatDate(file.createdAt)}
                      {file.seenAt ? ` · seen ${formatDate(file.seenAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      {file.kind.replace(/_/g, " ")}
                    </Badge>
                    <Badge
                      variant={file.seenAt ? "default" : "secondary"}
                      className="gap-1"
                      title={file.seenAt ? `Seen ${formatDate(file.seenAt)}` : "Not downloaded by the client yet"}
                    >
                      {file.seenAt ? (
                        <EyeIcon className="size-3" aria-hidden />
                      ) : (
                        <EyeOffIcon className="size-3" aria-hidden />
                      )}
                      {file.seenAt ? "Seen" : "Unseen"}
                    </Badge>
                    <a
                      href={API_ROUTES.fileDownload(file.id)}
                      className="text-sm underline-offset-4 hover:underline"
                    >
                      Download
                    </a>
                    {deleting ? (
                      <span className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-9 text-xs"
                          disabled={deleteFile.loadings.deleting}
                          onClick={() => void confirmDelete(file.id)}
                        >
                          Confirm delete
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-9 text-xs"
                          disabled={deleteFile.loadings.deleting}
                          onClick={() => setPendingDeleteId(null)}
                        >
                          Cancel
                        </Button>
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-11 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${file.filename}`}
                        onClick={() => setPendingDeleteId(file.id)}
                      >
                        <Trash2Icon className="size-4" aria-hidden />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
