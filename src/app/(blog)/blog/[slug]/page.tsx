import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CTA, ROUTES } from "@/config/constants";
import { blogPostSocial } from "@/content/blog";
import {
  getPublishedPostBySlug,
  listRecentPublishedPosts,
} from "@/lib/posts";
import { absoluteUrl } from "@/lib/seo/metadata";
import { blogPostingSchema, breadcrumbSchema } from "@/lib/seo/schema";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { JsonLd } from "@/components/common/json-ld";
import { PageHeader } from "@/components/common/page-header";
import { SiteDisclaimer } from "@/components/common/site-disclaimer";
import { BlogCard } from "@/components/marketing/blog-card";
import { sanitizePostHtml } from "@/lib/posts/sanitize";

type PostPageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  // notFound() here (before the streaming shell flushes) yields a real 404
  // status; throwing it in the page body after an await is a soft-404.
  if (!post) notFound();

  const { title, description, path } = blogPostSocial(post);
  const url = absoluteUrl(path);
  const cover = post.coverImageId
    ? absoluteUrl(`/api/posts/images/${post.coverImageId}`)
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ArchiPlan Studio`,
      description,
      url,
      siteName: "ArchiPlan Studio",
      type: "article",
      locale: "en_US",
      ...(post.publishedAt
        ? { publishedTime: post.publishedAt.toISOString() }
        : {}),
      ...(post.updatedAt ? { modifiedTime: post.updatedAt.toISOString() } : {}),
      ...(cover ? { images: [{ url: cover, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(cover ? { images: [cover] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const [post, latest] = await Promise.all([
    getPublishedPostBySlug(slug),
    listRecentPublishedPosts(3),
  ]);
  if (!post) notFound();

  const { title, description, path } = blogPostSocial(post);
  const others = latest.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Blog", href: ROUTES.blog },
          { label: post.title },
        ]}
      />
      <PageHeader
        title={post.title}
        description={post.excerpt}
        links={[{ label: CTA.primary, href: ROUTES.newOrder }]}
      />

      <article className="mx-auto w-full max-w-3xl px-4 pb-12">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {post.publishedAt ? (
            <time dateTime={post.publishedAt.toISOString()}>
              {dateFormatter.format(post.publishedAt)}
            </time>
          ) : null}
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min read</span>
          {post.author.name ? (
            <>
              <span aria-hidden>·</span>
              <span>{post.author.name}</span>
            </>
          ) : null}
        </div>

        {post.coverImageId ? (
          <div className="mb-8 aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- exact stored object */}
            <img
              src={`/api/posts/images/${post.coverImageId}`}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        {/* Sanitized twice: on write (createPost/updatePost) and again on read. */}
        <div
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.contentHtml) }}
        />

        {post.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2 border-t pt-6">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={ROUTES.blogTag(tag)}
                className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted"
              >
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-12">
          <SiteDisclaimer />
        </div>
      </article>

      {others.length > 0 ? (
        <section
          className="mx-auto w-full max-w-6xl border-t px-4 py-12"
          aria-labelledby="latest-posts"
        >
          <h2
            id="latest-posts"
            className="font-display text-3xl font-medium tracking-tight"
          >
            Latest articles
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((item) => (
              <BlogCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      ) : null}

      <ClosingCta
        links={[{ label: "Browse all guides", href: ROUTES.guides }]}
      />

      <JsonLd
        data={[
          blogPostingSchema({
            title,
            description,
            path,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            authorName: post.author.name,
            coverImageId: post.coverImageId,
          }),
          breadcrumbSchema([
            { label: "Home", href: ROUTES.home },
            { label: "Blog", href: ROUTES.blog },
            { label: post.title },
          ]),
        ]}
      />
    </main>
  );
}
