"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import type { PaginatedMeta } from "@/hooks/orders/use-admin-orders";

type OrdersPagerProps = {
  meta: PaginatedMeta;
};

export function OrdersPager({ meta }: OrdersPagerProps) {
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

  return (
    <nav className="flex items-center justify-between" aria-label="Orders pagination">
      <p className="text-sm text-muted-foreground">
        Page {meta.page} of {totalPages} · {meta.total} orders
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => goTo(meta.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page >= totalPages}
          onClick={() => goTo(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
