import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { APP, ROLES, ROUTES } from "@/config/constants";
import { resolveApiUser } from "@/lib/users";
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
  const { userId } = await auth();
  if (!userId) redirect(ROUTES.login);

  const user = await resolveApiUser(userId);
  if (user.role !== ROLES.ADMIN) redirect(ROUTES.dashboard);

  return <AdminShell email={user.email ?? user.name ?? "Admin"}>{children}</AdminShell>;
}
