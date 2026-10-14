import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserProfile } from "@clerk/nextjs";

import { ROLES, ROUTES } from "@/config/constants";
import { resolveApiUser } from "@/lib/users";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

/**
 * Clerk UserProfile catch-all (plan: account page). Mounts the full profile
 * UI — profile, emails, phone numbers, password, connected accounts, MFA —
 * under our chrome. The UserButton's "Manage account" navigates here
 * (`userProfileMode="navigation"`). Lives outside /dashboard on purpose:
 * the (client) layout redirects admins away, but this page serves every
 * signed-in role.
 */
export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.account)}`);
  }

  const user = await resolveApiUser(userId);

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Account" },
        ]}
      />
      <div className="mx-auto w-full max-w-6xl border-b px-4 pb-14 pt-12 md:pb-20 md:pt-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
          Your account
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">
          {user.name || "Account settings"}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {user.email} · {user.role === ROLES.ADMIN ? "Admin" : "Client"}
        </p>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <UserProfile path={ROUTES.account} routing="path" />
      </div>
    </main>
  );
}
