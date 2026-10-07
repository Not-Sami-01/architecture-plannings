import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROUTES, ROLES } from "@/config/constants";
import { APP } from "@/config/constants";

export const metadata: Metadata = {
  title: "Admin",
  description: `${APP.name} internal dashboard.`,
};

/**
 * UX gate only — real role checks also happen in every admin route handler
 * (requireRole). Layout-level enforcement keeps non-admins out of admin pages.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect(ROUTES.login);
  if (session.user.role !== ROLES.ADMIN) redirect(ROUTES.dashboard);

  return <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>;
}
