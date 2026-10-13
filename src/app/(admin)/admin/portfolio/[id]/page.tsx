import { PortfolioEditView } from "@/components/admin/portfolio-edit-view";

export const metadata = { title: "Edit project — Admin" };

export default function AdminPortfolioEditPage() {
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Edit project</h1>
      </div>
      <PortfolioEditView />
    </main>
  );
}
