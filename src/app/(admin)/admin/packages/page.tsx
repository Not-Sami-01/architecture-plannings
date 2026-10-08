import { PackagesView } from "@/components/admin/packages-view";

export const metadata = { title: "Pricing — Admin" };

export default function AdminPackagesPage() {
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Packages, prices and revision limits shown on the site and order form.
        </p>
      </div>
      <PackagesView />
    </main>
  );
}
