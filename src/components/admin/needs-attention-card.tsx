"use client";

import Link from "next/link";

import { ROUTES } from "@/config/constants";
import { useAdminStats } from "@/hooks/admin/use-admin-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type NeedsAttentionCardProps = {
  /** Rendered by the page while the stats load — keeps layout stable. */
  fallback?: React.ReactNode;
};

/**
 * Pending work aggregation (plan 3 P7): everything waiting on the admin,
 * each line linking to the status-filtered orders view.
 */
export function NeedsAttentionCard({ fallback }: NeedsAttentionCardProps) {
  const { data: stats, loadings, query } = useAdminStats();

  if (loadings.loading) {
    return fallback ?? <Skeleton className="h-48 w-full" />;
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Couldn&apos;t load pending work.</span>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = [
    { count: stats.needsAttention.submitted, label: "New orders awaiting a quote", status: "SUBMITTED" },
    { count: stats.needsAttention.awaitingAdvance, label: "Quote accepted, advance not yet verified", status: "AWAITING_ADVANCE" },
    { count: stats.needsAttention.inDesign, label: "In design", status: "IN_DESIGN" },
    { count: stats.needsAttention.draftDelivered, label: "Drafts waiting for client review", status: "DRAFT_DELIVERED" },
    { count: stats.needsAttention.awaitingFinalPayment, label: "Awaiting final payment", status: "AWAITING_FINAL_PAYMENT" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Needs attention</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.status}
            href={`${ROUTES.admin.orders}?status=${item.status}`}
            className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <span className="text-sm">{item.label}</span>
            <span className="text-base font-semibold tabular-nums">{item.count}</span>
          </Link>
        ))}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Link
            href={ROUTES.admin.orders}
            className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <span className="text-sm">Payments awaiting verification</span>
            <span className="text-base font-semibold tabular-nums">
              {stats.needsAttention.pendingPayments}
            </span>
          </Link>
          <Link
            href={ROUTES.admin.orders}
            className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <span className="text-sm">Revision requests to accept</span>
            <span className="text-base font-semibold tabular-nums">
              {stats.needsAttention.openRevisions}
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
