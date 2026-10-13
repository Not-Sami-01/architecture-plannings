import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  API_ROUTES,
  APP,
  CTA,
  PORTFOLIO_STYLE_OPTIONS,
  ROUTES,
} from "@/config/constants";
import { getVisibleProjectBySlug } from "@/lib/portfolio";
import { absoluteUrl } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { JsonLd } from "@/components/common/json-ld";
import { PageHeader } from "@/components/common/page-header";

type ProjectPageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

const styleLabels = new Map<string, string>(
  PORTFOLIO_STYLE_OPTIONS.map((option) => [option.value, option.label]),
);

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getVisibleProjectBySlug(slug);
  // notFound() here (before the streaming shell flushes) yields a real 404
  // status; throwing it in the page body after an await is a soft-404.
  if (!project) notFound();

  const title = `${project.title} — House Design`;
  const description =
    project.description ??
    `${project.plotSize} ${styleLabels.get(project.style)?.toLowerCase() ?? "house"} house design (${project.category.toLowerCase()}).`;
  const url = absoluteUrl(ROUTES.portfolioProject(project.slug));
  const cover = project.images[0]
    ? absoluteUrl(API_ROUTES.portfolioImage(project.images[0]))
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${APP.name}`,
      description,
      url,
      siteName: APP.name,
      type: "article",
      locale: "en_US",
      ...(project.updatedAt ? { modifiedTime: project.updatedAt.toISOString() } : {}),
      ...(cover ? { images: [{ url: cover, width: 1200, height: 900 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(cover ? { images: [cover] } : {}),
    },
  };
}

export default async function PortfolioProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getVisibleProjectBySlug(slug);
  if (!project) notFound();

  const styleLabel = styleLabels.get(project.style) ?? project.style;
  const cover = project.images[0];

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Portfolio", href: ROUTES.portfolio },
          { label: project.title },
        ]}
      />
      <PageHeader
        title={project.title}
        description={
          project.description ??
          `${project.plotSize} · ${styleLabel} · ${project.category}`
        }
        links={[{ label: "Order a similar design", href: ROUTES.newOrder }]}
      />

      <article className="mx-auto w-full max-w-5xl px-4 pb-12">
        <div className="grid gap-3 sm:grid-cols-2">
          {project.images.map((fileId, index) => (
            <figure
              key={fileId}
              className={index === 0 ? "sm:col-span-2 overflow-hidden rounded-xl border bg-muted" : "overflow-hidden rounded-xl border bg-muted"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- exact stored object */}
              <img
                src={API_ROUTES.portfolioImage(fileId)}
                alt={`${project.title} — image ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover"
              />
            </figure>
          ))}
        </div>

        <dl className="mt-8 grid gap-4 rounded-xl border p-5 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Plot size</dt>
            <dd className="mt-1 font-medium">{project.plotSize}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Category</dt>
            <dd className="mt-1 font-medium">{project.category}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Style</dt>
            <dd className="mt-1 font-medium">{styleLabel}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Reference</dt>
            <dd className="mt-1 font-medium">/portfolio/{project.slug}</dd>
          </div>
        </dl>

        {project.description ? (
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        ) : null}

        <div className="mt-8 rounded-xl border border-dashed bg-muted/30 p-6">
          <h2 className="text-lg font-semibold tracking-tight">Like this design?</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            We adapt the idea to your plot rather than copying it exactly. Upload this project as a
            reference in your order and the first draft will move closer to what you imagine.
          </p>
          <a
            href={ROUTES.newOrder}
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {CTA.primary}
          </a>
        </div>
      </article>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          description: project.description ?? `${project.plotSize} ${styleLabel} house design`,
          url: absoluteUrl(ROUTES.portfolioProject(project.slug)),
          ...(cover
            ? { image: absoluteUrl(API_ROUTES.portfolioImage(cover)) }
            : {}),
          isPartOf: { "@type": "WebSite", name: APP.name, url: absoluteUrl(ROUTES.home) },
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: ROUTES.home },
          { label: "Portfolio", href: ROUTES.portfolio },
          { label: project.title },
        ])}
      />

      <ClosingCta
        heading="Find your design"
        text="Start an order with your plot details, or see packages and pricing first."
        links={[{ label: "See packages and pricing", href: ROUTES.services }]}
      />
    </main>
  );
}
