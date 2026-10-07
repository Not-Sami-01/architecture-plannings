"use client";

import { PackageSearch } from "lucide-react";

import { ORDER_STATUSES, PAGINATION, ROUTES } from "@/config/constants";
import type { AdminOrderListQuery } from "@/lib/validators/admin-orders";
import { useAdminOrders } from "@/hooks/orders/use-admin-orders";
import { OrdersFilters } from "@/components/admin/orders-filters";
import { OrdersPager } from "@/components/admin/orders-pager";
import { OrdersTable } from "@/components/admin/orders-table";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type OrdersViewProps = {
  query: Partial<AdminOrderListQuery>;
};

function parseFromSearchParams(query: Partial<AdminOrderListQuery>): Partial<AdminOrderListQuery> {
  return {
    status:
      query.status && (Object.values(ORDER_STATUSES) as string[]).includes(query.status)
        ? query.status
        : undefined,
    q: query.q || undefined,
    sort: query.sort === "oldest" ? "oldest" : "newest",
    page: Number(query.page) || PAGINATION.defaultPage,
    pageSize: Number(query.pageSize) || PAGINATION.defaultPageSize,
  };
}

export function OrdersView({ query }: OrdersViewProps) {
  const filters = parseFromSearchParams(query);
  const { data, meta, loadings } = useAdminOrders(filters);

  return (
    <div className="flex flex-col gap-6">
      <OrdersFilters />

      {loadings.loading ? (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={filters.q || filters.status ? "No orders match these filters" : "No orders yet"}
          description={
            filters.q || filters.status
              ? "Try a different search or clear the filters."
              : "New client orders will appear here as soon as they are submitted."
          }
        />
      ) : (
        <>
          <OrdersTable orders={data} />
          <OrdersPager meta={meta} />
        </>
      )}

      <p className="sr-only">
        All orders are also reachable directly under {ROUTES.admin.orders}.
      </p>
    </div>
  );
}
