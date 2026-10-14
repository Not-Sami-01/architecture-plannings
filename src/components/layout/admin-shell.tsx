"use client";

import Link from "next/link";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  ClipboardListIcon,
  FileIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  MessageSquareIcon,
  NewspaperIcon,
  SettingsIcon,
  TagsIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

import { ROUTES } from "@/config/constants";
import { Logo } from "@/components/common/logo";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  { href: ROUTES.admin.portfolio, label: "Portfolio", icon: ImageIcon },
  { href: ROUTES.admin.blog, label: "Blog", icon: NewspaperIcon },
  { href: ROUTES.admin.settings, label: "Settings", icon: SettingsIcon },
];

function NavLink({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: typeof ClipboardListIcon;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

/** Sidebar shell for the admin panel — deliberately unlike the client panel. */
export function AdminShell({ email, children }: AdminShellProps) {
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);

  const signOutNow = () => {
    void signOut({ redirectUrl: ROUTES.home });
  };

  return (
    <div className="flex min-h-svh">
      {/* Desktop rail: liquid glass over the page backdrop. */}
      <aside className="liquid-glass liquid-glass-rail sticky top-0 hidden h-svh w-60 shrink-0 flex-col md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/15 px-4">
          <Logo href={ROUTES.admin.root} />
          <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Admin
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="flex flex-col gap-2 border-t border-white/15 p-3">
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
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOutIcon className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile: compact header + labeled drawer (the old wrapping icon
            row overflowed on narrow phones). */}
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Logo href={ROUTES.admin.root} />
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                aria-label={open ? "Close menu" : "Open menu"}
                className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted"
              >
                {open ? <XIcon className="size-5" aria-hidden /> : <MenuIcon className="size-5" aria-hidden />}
              </SheetTrigger>
              <SheetContent side="right" className="liquid-glass w-72 bg-transparent">
                <SheetTitle className="sr-only">Admin menu</SheetTitle>
                <nav className="flex flex-col gap-1" aria-label="Admin sections">
                  {NAV.map((item) => (
                    <NavLink key={item.href} {...item} onClick={() => setOpen(false)} />
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2 border-t border-white/15 pt-3">
                  <p className="truncate px-1 text-xs text-muted-foreground" title={email}>
                    {email}
                  </p>
                  <button
                    type="button"
                    onClick={signOutNow}
                    className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <LogOutIcon className="size-4" aria-hidden />
                    Sign out
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
