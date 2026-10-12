import Link from "next/link";
import Image from "next/image";

import { APP, ROUTES } from "@/config/constants";
import { cn } from "cn";

type LogoProps = {
  /** Link target (defaults to the home page). */
  href?: string;
  className?: string;
};

/**
 * Brand lockup: the supplied brick "A" on its original white field
 * (public/logo/mark.svg — no redrawing or recolouring, per the identity
 * rules) plus the wordmark in DM Serif Display. Used by the navbar, footer
 * and both shells.
 */
export function Logo({ href = ROUTES.home, className }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={APP.name}
      className={cn("inline-flex min-h-11 items-center gap-2.5", className)}
    >
      <Image
        src="/logo/mark.svg"
        alt=""
        aria-hidden
        width={28}
        height={28}
        unoptimized
        className="size-7 shrink-0 rounded-[0.25rem]"
      />
      {/* Inherits the surface ink: graphite on the marketing shell, chalk on the footer band. */}
      <span className="truncate font-display text-lg leading-none tracking-tight">
        {APP.name}
      </span>
    </Link>
  );
}
