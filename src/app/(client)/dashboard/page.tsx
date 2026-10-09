import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { ROUTES } from "@/config/constants";
import { resolveApiUser } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { OrderList } from "@/components/orders/order-list";

/** Client home: greeting + the signed-in user's orders (fetch lives in OrderList). */
export default async function DashboardPage() {
  const { userId } = await auth();
  const user = userId ? await resolveApiUser(userId) : null;
  const name = user?.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome{name ? `, ${name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your orders and their current status.
          </p>
        </div>
        <Button render={<Link href={ROUTES.newOrder} />}>Start an order</Button>
      </div>
      <OrderList />
    </div>
  );
}
