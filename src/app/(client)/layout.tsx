import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/config/constants";
import { auth } from "@/lib/auth";
import { ClientShell } from "@/components/layout/client-shell";

export const metadata: Metadata = {
  title: "My dashboard",
  robots: { index: false, follow: false },
};

/**
 * Gate + shell for the whole client panel. The proxy already checks the
 * session cookie at the edge; this re-checks the session server-side so
 * unauthenticated visitors never render panel markup.
 */
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.dashboard)}`);
  }

  return (
    <ClientShell
      name={session.user.name ?? session.user.email ?? "My account"}
      role={session.user.role}
    >
      {children}
    </ClientShell>
  );
}
