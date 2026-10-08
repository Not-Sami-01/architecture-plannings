"use client";

import { CheckIcon, CircleAlertIcon, ClockIcon, LoaderCircleIcon } from "lucide-react";

import { formatBytes } from "@/lib/format";
import type { BatchUploadItem } from "@/hooks/files/use-upload-batch";
import type { SubmitPhase } from "@/hooks/orders/use-submit-order";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type OrderSubmitProgressProps = {
  /** Live per-file rows from `useSubmitOrder`. */
  items: BatchUploadItem[];
  phase: SubmitPhase;
  onRetry: () => void;
  onEditFiles: () => void;
};

const TITLES: Record<Exclude<SubmitPhase, "idle">, { heading: string; sub: string }> = {
  uploading: {
    heading: "Uploading your files",
    sub: "Keep this tab open — your order is submitted once every file is stored.",
  },
  submitting: {
    heading: "Creating your order",
    sub: "All files uploaded. Finishing up…",
  },
  failed: {
    heading: "Some files didn’t upload",
    sub: "Your order was not submitted. Retry below, or edit your files first.",
  },
};

function StatusIcon({ item }: { item: BatchUploadItem }) {
  if (item.status === "uploading") {
    return <LoaderCircleIcon className="size-4 animate-spin text-primary" aria-hidden />;
  }
  if (item.status === "done") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CheckIcon className="size-3" aria-hidden />
      </span>
    );
  }
  if (item.status === "error") {
    return <CircleAlertIcon className="size-4 text-destructive" aria-hidden />;
  }
  return <ClockIcon className="size-4 text-muted-foreground" aria-hidden />;
}

/** Full-screen progress panel shown while staged files upload on submit. */
export function OrderSubmitProgress({
  items,
  phase,
  onRetry,
  onEditFiles,
}: OrderSubmitProgressProps) {
  if (phase === "idle") return null;

  const copy = TITLES[phase];
  const doneCount = items.filter((item) => item.status === "done").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-progress-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
        <div className="flex items-start gap-3">
          {phase === "failed" ? (
            <CircleAlertIcon className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          ) : (
            <LoaderCircleIcon className="mt-0.5 size-5 shrink-0 animate-spin text-primary" aria-hidden />
          )}
          <div>
            <h2 id="submit-progress-heading" className="font-semibold tracking-tight">
              {copy.heading}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{copy.sub}</p>
          </div>
        </div>

        {items.length > 0 && (
          <ul className="mt-5 flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.key}
                className="rounded-lg border bg-background/50 px-3 py-2.5"
                aria-live="polite"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon item={item} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(item.size)}
                      {item.status === "uploading" ? ` · ${item.percent}%` : ""}
                      {item.status === "error" && item.error ? (
                        <span className="block text-destructive">{item.error}</span>
                      ) : null}
                    </p>
                  </div>
                  {item.status === "uploading" ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.percent}%
                    </span>
                  ) : null}
                </div>
                {item.status === "uploading" ? (
                  <Progress
                    value={item.percent}
                    aria-label={`Uploading ${item.name}`}
                    className="mt-2"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {phase !== "failed" && items.length > 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">
            {doneCount} of {items.length} files stored
          </p>
        ) : null}

        {phase === "failed" ? (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onEditFiles}>
              Edit files
            </Button>
            <Button type="button" onClick={onRetry}>
              Retry failed files
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
