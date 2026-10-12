"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
  ClipboardListIcon,
  FileIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareIcon,
  SettingsIcon,
  TagsIcon,
  UsersIcon,
} from "lucide-react";

import { APP, ROUTES } from "@/config/constants";
import { ThemeSwitcher } from "@/components/common/theme-switcher";

type AdminShellProps = {
  /** Signed-in admin email, rendered from the server session. */
  email: string;
  children: React.ReactNode;
};

const NAV = [
  { href: ROUTES.admin.root, label: "Dashboard", icon: LayoutDashboardIcon },
  { href: ROUTES.admin.orders, label: "Orders", icon: ClipboardListIcon },
  { href: ROUTES.admin.chats, label: "Chats", icon: MessageSquareIcon },
  { href: ROUTES.admin.files, label: "Files", icon: FileIcon },
  { href: ROUTES.admin.users, label: "Users", icon: UsersIcon },
  { href: ROUTES.admin.packages, label: "Pricing", icon: TagsIcon },
  { href: ROUTES.admin.settings, label: "Settings", icon: SettingsIcon },
];

/** Sidebar shell for the admin panel — deliberately unlike the client panel. */
export function AdminShell({ email, children }: AdminShellProps) {
  const { signOut } = useClerk();

  const signOutNow = () => {
    void signOut({ redirectUrl: ROUTES.home });
  };

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-muted/30 md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Link href={ROUTES.admin.root} className="truncate text-sm font-semibold tracking-tight">
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
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-muted-foreground">Appearance</span>
            <ThemeSwitcher />
          </div>
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
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-2 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Link href={ROUTES.admin.root} className="truncate text-sm font-semibold">
              {APP.name}
            </Link>
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Admin
            </span>
          </div>
          {/* Seven icons + actions: wrap instead of overflowing on narrow phones. */}
          <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Admin sections">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <item.icon className="size-4" aria-hidden />
              </Link>
            ))}
            <ThemeSwitcher />
            <button
              type="button"
              onClick={signOutNow}
              aria-label="Sign out"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            >
              <LogOutIcon className="size-4" aria-hidden />
            </button>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
