import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CTA, ROUTES } from "@/config/constants";
import { blogTagSeo } from "@/content/blog";
import { listPublishedPosts, listPublishedTags } from "@/lib/posts";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo/schema";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { EmptyState } from "@/components/common/empty-state";
import { JsonLd } from "@/components/common/json-ld";
import { PageHeader } from "@/components/common/page-header";
import { BlogCard } from "@/components/marketing/blog-card";
import { FileTextIcon } from "lucide-react";

type TagPageProps = { params: Promise<{ tag: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  // Validate the tag here so unknown tags 404 with a real status (before the
  // streaming shell flushes); the page body repeats the check after its own fetch.
  const tags = await listPublishedTags();
  if (!tags.includes(tag)) notFound();
  return buildMetadata(blogTagSeo(tag));
}

export default async function BlogTagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const [tags, posts] = await Promise.all([
    listPublishedTags(),
    listPublishedPosts({ tag, limit: 60 }),
  ]);
  // Unknown tag → 404 (never 403) so empty states only show for real tags.
  if (!tags.includes(tag)) notFound();

  const seo = blogTagSeo(tag);

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Blog", href: ROUTES.blog },
          { label: `#${tag}` },
        ]}
      />
      <PageHeader
        eyebrow="Tag"
        title={`Articles tagged #${tag}`}
        description={seo.description}
        links={[
          { label: CTA.primary, href: ROUTES.newOrder },
          { label: "All articles", href: ROUTES.blog },
        ]}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        <nav aria-label="Tags" className="mb-8 flex flex-wrap gap-2">
          {tags.map((item) => (
            <Link
              key={item}
              href={ROUTES.blogTag(item)}
              aria-current={item === tag ? "page" : undefined}
              className={
                item === tag
                  ? "rounded-full border bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                  : "rounded-full border px-3 py-1.5 text-sm hover:bg-muted"
              }
            >
              #{item}
            </Link>
          ))}
        </nav>

        {posts.length === 0 ? (
          <EmptyState
            icon={FileTextIcon}
            title="Nothing published here yet"
            description="This tag has no published articles. Try another tag or browse everything."
            action={
              <Link href={ROUTES.blog} className="text-primary underline underline-offset-4">
                All articles
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      <ClosingCta />

      <JsonLd
        data={[
          collectionPageSchema({
            name: seo.title,
            description: seo.description,
            path: seo.path,
          }),
          breadcrumbSchema([
            { label: "Home", href: ROUTES.home },
            { label: "Blog", href: ROUTES.blog },
            { label: `#${tag}` },
          ]),
        ]}
      />
    </main>
  );
}
