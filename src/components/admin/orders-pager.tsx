"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import type { PaginatedMeta } from "@/hooks/orders/use-admin-orders";

type OrdersPagerProps = {
  meta: PaginatedMeta;
  /**
   * Local page handler (the client dashboard list owns its filters in
   * React state). When omitted the pager writes `?page=` into the admin
   * orders URL — the shareable-link behaviour the admin view wants.
   */
  onPageChange?: (page: number) => void;
};

export function OrdersPager({ meta, onPageChange }: OrdersPagerProps) {
  if (onPageChange) {
    return <LocalPager meta={meta} onPage={onPageChange} />;
  }
  return <UrlPager meta={meta} />;
}

function PagerView({
  meta,
  totalPages,
  onGo,
}: {
  meta: PaginatedMeta;
  totalPages: number;
  onGo: (page: number) => void;
}) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-2" aria-label="Orders pagination">
      <p className="text-sm text-muted-foreground">
        Page {meta.page} of {totalPages} · {meta.total} orders
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onGo(meta.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page >= totalPages}
          onClick={() => onGo(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

/** Client dashboard: paging is React state, no URL round-trip. */
function LocalPager({ meta, onPage }: { meta: PaginatedMeta; onPage: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(meta.total / (meta.pageSize || 1)));
  if (meta.total === 0) return null;
  return <PagerView meta={meta} totalPages={totalPages} onGo={onPage} />;
}

/** Admin orders: paging lives in the query string (shareable links). */
function UrlPager({ meta }: { meta: PaginatedMeta }) {
  const router = useRouter();
  const params = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(meta.total / (meta.pageSize || 1)));
  if (meta.total === 0) return null;

  const goTo = (page: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(page));
    const updatedParams = next.toString();
    router.push(`${ROUTES.admin.orders}?${updatedParams}`, { scroll: false });
  };

  return <PagerView meta={meta} totalPages={totalPages} onGo={goTo} />;
}
