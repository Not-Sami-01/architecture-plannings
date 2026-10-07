import Link from "next/link";
import { redirect } from "next/navigation";

import { ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

/**
 * Placeholder client dashboard (Phase 1.9+ replaces this with the orders list).
 * Kept minimal so login has a real redirect target.
 */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.dashboard)}`);
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {session.user.name ?? session.user.email}
        </h1>
        <p className="text-muted-foreground">You have no orders yet.</p>
      </div>
      <Button render={<Link href={ROUTES.newOrder} />}>Start a new order</Button>
    </main>
  );
}
