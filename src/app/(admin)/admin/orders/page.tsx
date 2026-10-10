import type { AdminOrderListQuery } from "@/lib/validators/admin-orders";
import { OrdersView } from "@/components/admin/orders-view";

export const metadata = { title: "Orders — Admin" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const query = {
    status: typeof params.status === "string" ? params.status : undefined,
    q: typeof params.q === "string" ? params.q : undefined,
    sort: params.sort === "oldest" ? "oldest" : params.sort === "newest" ? "newest" : undefined,
    page: typeof params.page === "string" ? Number(params.page) : undefined,
    pageSize: typeof params.pageSize === "string" ? Number(params.pageSize) : undefined,
  } as Partial<AdminOrderListQuery>;

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every submitted order. Open one to send a quote, update its status, and message the
          client.
        </p>
      </div>
      <OrdersView query={query} />
    </main>
  );
}
