import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP, ROLES, ROUTES } from "@/config/constants";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/layout/admin-shell";

export const metadata: Metadata = {
  title: "Admin",
  description: `${APP.name} internal dashboard.`,
  robots: { index: false, follow: false },
};

/**
 * UX gate only — real role checks also happen in every admin route handler
 * (requireRole). Layout-level enforcement keeps non-admins out of admin pages.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect(ROUTES.login);
  if (session.user.role !== ROLES.ADMIN) redirect(ROUTES.dashboard);

  return (
    <AdminShell email={session.user.email ?? session.user.name ?? "Admin"}>
      {children}
    </AdminShell>
  );
}
