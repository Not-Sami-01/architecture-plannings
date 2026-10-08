import Link from "next/link";

import { ROUTES } from "@/config/constants";
import { OrderDetailView } from "@/components/orders/order-detail-view";

export const metadata = { title: "Order detail" };

export default async function DashboardOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={ROUTES.dashboard}
        className="w-fit text-sm font-medium text-primary hover:underline"
      >
        ← Back to my orders
      </Link>
      <OrderDetailView orderId={id} />
    </div>
  );
}
