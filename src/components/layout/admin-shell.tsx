"use client";

import Link from "next/link";
import { ClipboardListIcon, LogOutIcon, TagsIcon } from "lucide-react";
import { signOut } from "next-auth/react";

import { APP, ROUTES } from "@/config/constants";

type AdminShellProps = {
  /** Signed-in admin email, rendered from the server session. */
  email: string;
  children: React.ReactNode;
};

const NAV = [
  { href: ROUTES.admin.orders, label: "Orders", icon: ClipboardListIcon },
  { href: ROUTES.admin.packages, label: "Pricing", icon: TagsIcon },
];

/** Sidebar shell for the admin panel — deliberately unlike the client panel. */
export function AdminShell({ email, children }: AdminShellProps) {
  const signOutNow = () => {
    void signOut({ callbackUrl: ROUTES.home });
  };

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-muted/30 md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Link href={ROUTES.admin.orders} className="truncate text-sm font-semibold tracking-tight">
            {APP.name}
          </Link>
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Admin
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2 border-t p-3">
          <p className="truncate px-1 text-xs text-muted-foreground" title={email}>
            {email}
          </p>
          <button
            type="button"
            onClick={signOutNow}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOutIcon className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b px-4 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Link href={ROUTES.admin.orders} className="truncate text-sm font-semibold">
              {APP.name}
            </Link>
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.admin.orders}
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Orders
            </Link>
            <Link
              href={ROUTES.admin.packages}
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Pricing
            </Link>
            <button
              type="button"
              onClick={signOutNow}
              aria-label="Sign out"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            >
              <LogOutIcon className="size-4" aria-hidden />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
