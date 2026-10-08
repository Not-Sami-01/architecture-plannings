import { AdminOrderDetailView } from "@/components/admin/admin-order-detail-view";

export const metadata = { title: "Order detail — Admin" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main>
      <AdminOrderDetailView orderId={id} />
    </main>
  );
}
