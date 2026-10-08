import { formatBytes } from "@/lib/format";
import { API_ROUTES } from "@/config/constants";
import type { AdminOrderDetail } from "@/hooks/orders/use-admin-order-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";

type OrderDetailUploadsProps = {
  files: AdminOrderDetail["files"];
};

export function OrderDetailUploads({ files }: OrderDetailUploadsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">uploads ({files.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <EmptyState title="No files attached" description="The client did not upload any plot files." />
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
