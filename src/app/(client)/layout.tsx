import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ROUTES } from "@/config/constants";
import { resolveApiUser } from "@/lib/users";
import { ClientShell } from "@/components/layout/client-shell";

export const metadata: Metadata = {
  title: "My dashboard",
  robots: { index: false, follow: false },
};

/**
 * Gate + shell for the whole client panel. The proxy already checks the
 * session at the edge; this re-checks server-side so unauthenticated
 * visitors never render panel markup.
 */
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.dashboard)}`);
  }

  const user = await resolveApiUser(userId);

  return (
    <ClientShell name={user.name ?? user.email ?? "My account"} role={user.role}>
      {children}
    </ClientShell>
  );
}
