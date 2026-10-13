import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PortfolioTable } from "@/components/admin/portfolio-table";

export const metadata = { title: "Portfolio — Admin" };

export default function AdminPortfolioPage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projects shown on /portfolio — reorder with the arrows, star the featured ones.
          </p>
        </div>
        <Button render={<Link href="/admin/portfolio/new" />}>
          <PlusIcon data-icon="inline-start" />
          New project
        </Button>
      </div>
      <PortfolioTable />
    </main>
  );
}
