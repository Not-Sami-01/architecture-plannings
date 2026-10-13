import Link from "next/link";

import { API_ROUTES, PORTFOLIO_STYLE_OPTIONS, ROUTES } from "@/config/constants";

export type PortfolioCardData = {
  slug: string;
  title: string;
  category: string;
  plotSize: string;
  style: string;
  description: string | null;
  images: string[];
  featured: boolean;
};

const styleLabels = new Map<string, string>(
  PORTFOLIO_STYLE_OPTIONS.map((option) => [option.value, option.label]),
);

/** Grid card for the /portfolio gallery (Phase 5). */
export function PortfolioCard({ project }: { project: PortfolioCardData }) {
  const cover = project.images[0];
  const styleLabel = styleLabels.get(project.style) ?? project.style;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <Link
        href={ROUTES.portfolioProject(project.slug)}
        className="relative block aspect-[4/3] w-full bg-muted"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- exact stored object
          <img
            src={API_ROUTES.portfolioImage(cover)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : null}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
          {project.plotSize}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5">{project.category}</span>
          <span>{styleLabel}</span>
        </div>
        <h3 className="font-display text-xl font-medium leading-snug tracking-tight">
          <Link
            href={ROUTES.portfolioProject(project.slug)}
            className="text-foreground hover:text-primary"
          >
            {project.title}
          </Link>
        </h3>
        {project.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        ) : null}
        <Link
          href={ROUTES.portfolioProject(project.slug)}
          className="mt-auto text-sm font-medium text-primary hover:underline"
        >
          View project →
        </Link>
      </div>
    </article>
  );
}
