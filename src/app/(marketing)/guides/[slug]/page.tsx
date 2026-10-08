import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CTA, ROUTES } from "@/config/constants";
import { GUIDES, guideBySlug } from "@/content/guides";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { ContentSections } from "@/components/common/content-sections";
import { PageHeader } from "@/components/common/page-header";
import { SiteDisclaimer } from "@/components/common/site-disclaimer";

type GuidePageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) return {};
  // Unwritten guides stay out of the index until the full article is published.
  return buildMetadata(guide.seo, { noindex: !guide.published });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) notFound();

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Guides", href: ROUTES.guides },
          { label: guide.seo.title },
        ]}
      />
      <PageHeader
        title={guide.seo.title}
        description={guide.summary}
        links={[{ label: CTA.primary, href: ROUTES.newOrder }]}
      />

      <article className="mx-auto w-full max-w-3xl px-4 pb-12">
        {guide.published && guide.blocks.length > 0 ? (
          <ContentSections blocks={guide.blocks} />
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 p-6">
            <p className="font-medium">This guide is being written</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We publish guides only after they have been reviewed for accuracy — no filler. In the
              meantime, the service pages explain the same ground with real examples:
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              <li>
                <Link href={ROUTES.services} className="font-medium text-primary underline underline-offset-4">
                  Packages and pricing
                </Link>{" "}
                <span className="text-muted-foreground">— what each drawing package includes</span>
              </li>
              <li>
                <Link href={ROUTES.howItWorks} className="font-medium text-primary underline underline-offset-4">
                  How it works
                </Link>{" "}
                <span className="text-muted-foreground">— the five-step process</span>
              </li>
              <li>
                <Link href={ROUTES.portfolio} className="font-medium text-primary underline underline-offset-4">
                  Portfolio
                </Link>{" "}
                <span className="text-muted-foreground">— real layouts and elevations</span>
              </li>
            </ul>
          </div>
        )}

        <div className="mt-12">
          <SiteDisclaimer />
        </div>
      </article>

      <ClosingCta
        text="Have a question this guide does not answer? Start an order or ask us directly."
        links={[{ label: "Contact us", href: ROUTES.contact }]}
      />
    </main>
  );
}
