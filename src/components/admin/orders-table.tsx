"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { formatMoney } from "@/lib/format";
import { ROUTES } from "@/config/constants";
import type { AdminOrderRow } from "@/hooks/orders/use-admin-orders";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type OrdersTableProps = {
  orders: AdminOrderRow[];
};

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Taken by</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Files</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link
                  href={ROUTES.admin.order(order.id)}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {order.number}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{order.user.name ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">{order.user.email}</span>
                </div>
              </TableCell>
              <TableCell>{order.package.name}</TableCell>
              <TableCell>{order.city}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="max-w-36 truncate text-xs text-muted-foreground">
                {order.assignedTo
                  ? order.assignedTo.name ?? order.assignedTo.email
                  : "—"}
              </TableCell>
              <TableCell>
                {order.totalPrice != null ? formatMoney(order.totalPrice, order.currency) : "—"}
              </TableCell>
              <TableCell>{order._count.files}</TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button
                  size="xs"
                  variant="outline"
                  render={<Link href={ROUTES.admin.orderProceed(order.id)} />}
                >
                  Proceed
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
