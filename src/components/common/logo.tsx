import Link from "next/link";
import Image from "next/image";

import { APP, ROUTES } from "@/config/constants";
import { cn } from "cn";

/** Brick-A mark variants supplied in the brand kit (public/logo/). */
const MARKS = {
  /** Black A on its original white field — light surfaces. */
  "on-light": "/logo/mark.svg",
  /** White A on a black field — dark surfaces (footer band). */
  "on-dark": "/logo/mark-dark.svg",
} as const;

type LogoProps = {
  /** Link target (defaults to the home page). */
  href?: string;
  /** Which mark variant fits the surface behind the logo. */
  tone?: keyof typeof MARKS;
  className?: string;
};

/**
 * Brand lockup: the supplied brick "A" (no redrawing or recolouring, per the
 * identity rules) plus the wordmark in Space Grotesk. Used by the navbar,
 * footer, auth pages, both shells and the 404/error pages.
 */
export function Logo({ href = ROUTES.home, tone = "on-light", className }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={APP.name}
      className={cn("inline-flex min-h-11 items-center gap-2.5", className)}
    >
      <Image
        src={MARKS[tone]}
        alt=""
        aria-hidden
        width={28}
        height={28}
        unoptimized
        className="size-7 shrink-0 rounded-[0.25rem]"
      />
      {/* Inherits the surface ink: graphite on light surfaces, chalk on the footer band. */}
      <span className="truncate font-display font-medium text-lg leading-none tracking-tight">
        {APP.name}
      </span>
    </Link>
  );
}
