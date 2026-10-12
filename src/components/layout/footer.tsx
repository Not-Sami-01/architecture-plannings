import Link from "next/link";

import { APP, NAV_LINKS, ROUTES } from "@/config/constants";
import { Logo } from "@/components/common/logo";
import { SiteDisclaimer } from "@/components/common/site-disclaimer";
import { publicConfig } from "@/config/public-config";

export function Footer() {
  return (
    <footer className="bg-hero text-hero-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 md:flex-row md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-hero-ink/60">{APP.tagline}</p>
        </div>

        <nav className="grid grid-cols-2 gap-x-10 gap-y-1" aria-label="Footer">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm text-hero-ink/70 transition-colors hover:text-hero-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="text-sm text-hero-ink/70">
          <p className="font-display text-lg text-hero-ink">Questions?</p>
          {publicConfig.whatsappNumber ? (
            <a
              href={`https://wa.me/${publicConfig.whatsappNumber}`}
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-hero-ink"
              target="_blank"
              rel="noopener noreferrer"
            >
              Message us on WhatsApp
            </a>
          ) : (
            <Link
              href={ROUTES.contact}
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-hero-ink"
            >
              Contact us
            </Link>
          )}
        </div>
      </div>
      <div className="border-t border-hero-ink/10 py-5">
        <div className="mx-auto w-full max-w-6xl px-4">
          <SiteDisclaimer className="text-center text-hero-ink/50" />
          <p className="mt-2 text-center text-xs text-hero-ink/50">
            © {new Date().getFullYear()} {APP.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
