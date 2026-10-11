import { formatBytes } from "@/lib/format";
import { API_ROUTES } from "@/config/constants";
import type { AdminOrderDetail } from "@/hooks/orders/use-admin-order-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { OrderUploadControls } from "@/components/admin/order-upload-controls";

type OrderDetailUploadsProps = {
  files: AdminOrderDetail["files"];
  orderId: string;
};

export function OrderDetailUploads({ files, orderId }: OrderDetailUploadsProps) {
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
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{file.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.mime} · {formatBytes(file.size)} ·{" "}
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{file.kind}</Badge>
                  <a
                    href={API_ROUTES.fileDownload(file.id)}
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
