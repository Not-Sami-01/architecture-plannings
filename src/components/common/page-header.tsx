import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Small label above the title (e.g. section eyebrow). */
  eyebrow?: string;
  /** Text links under the description (e.g. "Start your order"). */
  links?: readonly { label: string; href: string }[];
};

export function PageHeader({ title, description, eyebrow, links }: PageHeaderProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      {eyebrow ? (
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-accent-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      {description ? (
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {links && links.length > 0 ? (
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {link.label}
            </Link>
          ))}
        </p>
      ) : null}
    </div>
  );
}
