import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Small label above the title (e.g. section eyebrow). */
  eyebrow?: string;
  /** Text links under the description (e.g. "Start your order"). */
  links?: readonly { label: string; href: string }[];
};

/** Editorial page title: tracked eyebrow, serif headline, lead paragraph, text links. */
export function PageHeader({ title, description, eyebrow, links }: PageHeaderProps) {
  return (
    <div className="mx-auto w-full max-w-6xl border-b px-4 pb-14 pt-12 md:pb-20 md:pt-20">
      {eyebrow ? (
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
          {eyebrow}
        </p>
      ) : null}
      <div className="grid gap-6 md:grid-cols-12">
        <h1 className="font-display font-medium text-4xl leading-[1.06] tracking-tight md:col-span-7 md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl self-end text-base leading-relaxed text-muted-foreground md:col-span-5">
            {description}
          </p>
        ) : null}
      </div>
      {links && links.length > 0 ? (
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {link.label}
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          ))}
        </p>
      ) : null}
    </div>
  );
}
