import { AdminSettingsView } from "@/components/admin/admin-settings-view";

export const metadata = { title: "Settings — Admin" };

export default function AdminSettingsPage() {
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Site-wide configuration. Changes apply live to every open admin panel.
        </p>
      </div>
      <AdminSettingsView />
    </main>
  );
}
