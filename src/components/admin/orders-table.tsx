"use client";

import Link from "next/link";

import { formatMoney } from "@/lib/format";
import { ROUTES } from "@/config/constants";
import type { AdminOrderRow } from "@/hooks/orders/use-admin-orders";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
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
            <TableHead>Price</TableHead>
            <TableHead>Files</TableHead>
            <TableHead>Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link
                  href={`${ROUTES.admin.orders}/${order.id}`}
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
              <TableCell>{order.totalPrice != null ? formatMoney(order.totalPrice) : "—"}</TableCell>
              <TableCell>{order._count.files}</TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
