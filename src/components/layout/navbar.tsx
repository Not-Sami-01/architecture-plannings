"use client";

import Link from "next/link";
import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";

import { APP, NAV_LINKS, ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** Marketing navbar. Session-aware actions live in the dashboard layouts. */
export function Navbar() {
  const [open, setOpen] = useState(false);

  const links = (
    <>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setOpen(false)}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={ROUTES.home} className="text-lg font-semibold tracking-tight">
          {APP.name}
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {links}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" render={<Link href={ROUTES.login} />}>
            Sign in
          </Button>
          <Button render={<Link href={ROUTES.newOrder} />}>Start an order</Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted md:hidden"
          >
            {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <nav className="flex flex-col gap-1 pt-4" aria-label="Mobile">
              {links}
              <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                <Button variant="outline" render={<Link href={ROUTES.login} />} onClick={() => setOpen(false)}>
                  Sign in
                </Button>
                <Button render={<Link href={ROUTES.newOrder} />} onClick={() => setOpen(false)}>
                  Start an order
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
