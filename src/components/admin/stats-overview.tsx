"use client";

import Link from "next/link";
import {
  BanknoteIcon,
  DraftingCompassIcon,
  FileClockIcon,
  InboxIcon,
  PencilRulerIcon,
  ReceiptTextIcon,
  WalletIcon,
} from "lucide-react";

import { APP, ROUTES } from "@/config/constants";
import { formatMoney } from "@/lib/format";
import { useSettings } from "@/hooks/settings/use-settings";
import { useAdminStats } from "@/hooks/admin/use-admin-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard overview (plan 3 P7): revenue KPIs, status funnel, pending
 * attention items and the ten most recent orders — one live query.
 */

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xl font-semibold tabular-nums">{value}</span>
        </div>
        <span className="rounded-lg border bg-muted p-2 text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}

export function StatsOverview() {
  const { data: stats, loadings, query } = useAdminStats();
  const { data: settings } = useSettings();
  const currency = settings?.currency ?? APP.currency;

  if (loadings.loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Stats couldn&apos;t load.</span>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const funnel = [
    { status: "SUBMITTED", count: stats.needsAttention.submitted, icon: InboxIcon, label: "Submitted" },
    { status: "AWAITING_ADVANCE", count: stats.needsAttention.awaitingAdvance, icon: WalletIcon, label: "Awaiting advance" },
    { status: "IN_DESIGN", count: stats.needsAttention.inDesign, icon: PencilRulerIcon, label: "In design" },
    { status: "DRAFT_DELIVERED", count: stats.needsAttention.draftDelivered, icon: DraftingCompassIcon, label: "Draft delivered" },
    { status: "AWAITING_FINAL_PAYMENT", count: stats.needsAttention.awaitingFinalPayment, icon: ReceiptTextIcon, label: "Awaiting final" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total revenue (paid)"
          value={formatMoney(stats.revenue.totalPaid, currency)}
          icon={BanknoteIcon}
        />
        <KpiCard
          label="Revenue this month"
          value={formatMoney(stats.revenue.thisMonthPaid, currency)}
          icon={FileClockIcon}
        />
        <KpiCard
          label="Advance payments received"
          value={formatMoney(stats.revenue.advancePaid, currency)}
          icon={WalletIcon}
        />
        <KpiCard
          label="Extra revision charges"
          value={formatMoney(stats.revenue.extraRevisionPaid, currency)}
          icon={ReceiptTextIcon}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status funnel</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {funnel.map((step) => (
            <Link
              key={step.status}
              href={`${ROUTES.admin.orders}?status=${step.status}`}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <span className="rounded-lg border bg-muted p-2 text-muted-foreground">
                <step.icon className="size-4" aria-hidden />
              </span>
              <span className="flex flex-col">
                <span className="text-lg font-semibold tabular-nums">{step.count}</span>
                <span className="text-xs text-muted-foreground">{step.label}</span>
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
