"use client";

import Link from "next/link";
import { useState } from "react";
import { MenuIcon, UserIcon, XIcon } from "lucide-react";

import { CTA, NAV_LINKS, ROUTES } from "@/config/constants";
import { useSession } from "@/hooks/auth/use-session";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/common/logo";
import { ThemeSwitcher } from "@/components/common/theme-switcher";

/**
 * Floating glass navbar (brand §Digital expression: 85% paper tint, 18px blur,
 * luminous edge, 20px radius). Signed-in visitors get a profile shortcut.
 */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const links = (
    <>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setOpen(false)}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  const authAction = session ? (
    <Button
      variant="ghost"
      render={<Link href={ROUTES.dashboard} />}
      aria-label="Open your dashboard"
    >
      <UserIcon className="mr-1 size-4" aria-hidden />
      Profile
    </Button>
  ) : (
    <Button variant="ghost" render={<Link href={ROUTES.login} />}>
      Sign in
    </Button>
  );

  return (
    <header className="sticky top-3 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-5xl rounded-[20px] border border-glass-edge bg-glass/85 shadow-glass backdrop-blur-[18px]">
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        <Logo />

        <nav className="hidden items-center gap-4 xl:flex" aria-label="Main">
          {links}
        </nav>

        <div className="hidden items-center gap-1 xl:flex">
          <ThemeSwitcher />
          {authAction}
          <Button render={<Link href={ROUTES.newOrder} />}>{CTA.primary}</Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted xl:hidden"
          >
            {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <nav className="flex flex-col gap-1 pt-4" aria-label="Mobile">
              {links}
              <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Appearance</span>
                  <ThemeSwitcher />
                </div>
                <Button
                  variant="outline"
                  render={
                    <Link href={session ? ROUTES.dashboard : ROUTES.login} />
                  }
                  onClick={() => setOpen(false)}
                >
                  {session ? (
                    <>
                      <UserIcon className="mr-1 size-4" aria-hidden />
                      Profile
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
                <Button render={<Link href={ROUTES.newOrder} />} onClick={() => setOpen(false)}>
                  {CTA.primary}
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
