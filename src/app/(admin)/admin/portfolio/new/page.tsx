import { PortfolioForm } from "@/components/admin/portfolio-form";

export const metadata = { title: "New project — Admin" };

export default function AdminPortfolioNewPage() {
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visible on /portfolio by default — flip the switch off to save it as a hidden draft.
        </p>
      </div>
      <PortfolioForm project={null} />
    </main>
  );
}
