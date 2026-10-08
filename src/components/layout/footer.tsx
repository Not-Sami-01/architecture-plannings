import Link from "next/link";

import { APP, NAV_LINKS } from "@/config/constants";
import { SiteDisclaimer } from "@/components/common/site-disclaimer";
import { publicConfig } from "@/config/public-config";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:justify-between">
        <div className="max-w-xs">
          <p className="text-base font-semibold">{APP.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">{APP.tagline}</p>
        </div>

        <nav className="grid grid-cols-2 gap-x-10 gap-y-2" aria-label="Footer">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Questions?</p>
          {publicConfig.whatsappNumber ? (
            <a
              href={`https://wa.me/${publicConfig.whatsappNumber}`}
              className="underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Message us on WhatsApp
            </a>
          ) : (
            <span>Set NEXT_PUBLIC_WHATSAPP_NUMBER to enable chat.</span>
          )}
        </div>
      </div>
      <div className="border-t py-4">
        <div className="mx-auto w-full max-w-6xl px-4">
          <SiteDisclaimer className="text-center" />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
