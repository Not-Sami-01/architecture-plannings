import { StatsOverview } from "@/components/admin/stats-overview";
import { NeedsAttentionCard } from "@/components/admin/needs-attention-card";
import { RecentOrdersCard } from "@/components/admin/recent-orders-card";

export const metadata = { title: "Dashboard — Admin" };

/** One real overview (plan 3 P7) — no longer a redirect to /admin/orders. */
export default async function AdminDashboardPage() {
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenue, funnel and everything waiting on you.
        </p>
      </div>
      <StatsOverview />
      <div className="grid gap-6 lg:grid-cols-2">
        <NeedsAttentionCard />
        <RecentOrdersCard />
      </div>
    </main>
  );
}
