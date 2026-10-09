"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";

import { APP, ROLES, ROUTES } from "@/config/constants";
import type { Role } from "@/config/constants";
import { Button } from "@/components/ui/button";

type ClientShellProps = {
  /** Greeting; comes from the server session in the (client) layout. */
  name: string;
  /** Session role — admins get a shortcut into the admin panel. */
  role?: Role;
  children: React.ReactNode;
};

/** Header + main shell for the client panel (dashboard and its sub-pages). */
export function ClientShell({ name, role, children }: ClientShellProps) {
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link
              href={ROUTES.dashboard}
              className="truncate text-lg font-semibold tracking-tight"
            >
              {APP.name}
            </Link>
            <nav
              className="hidden items-center gap-4 md:flex"
              aria-label="Dashboard"
            >
              <Link
                href={ROUTES.dashboard}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                My orders
              </Link>
              <Link
                href={ROUTES.newOrder}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Start an order
              </Link>
              {role === ROLES.ADMIN ? (
                <Link
                  href={ROUTES.admin.orders}
                  className="text-sm font-medium text-primary transition-colors hover:underline"
                >
                  Admin panel
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-40 truncate text-sm text-muted-foreground sm:inline">
              {name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void signOut({ redirectUrl: ROUTES.home });
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
