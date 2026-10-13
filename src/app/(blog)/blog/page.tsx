import type { Metadata } from "next";
import Link from "next/link";

import { CTA, ROUTES } from "@/config/constants";
import { blogIndexSeo } from "@/content/blog";
import { listPublishedPosts, listPublishedTags } from "@/lib/posts";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ClosingCta } from "@/components/common/closing-cta";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { BlogCard } from "@/components/marketing/blog-card";
import { FileTextIcon } from "lucide-react";

export const metadata: Metadata = buildMetadata(blogIndexSeo);

export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const [posts, tags] = await Promise.all([
    listPublishedPosts({ limit: 60 }),
    listPublishedTags(),
  ]);

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Blog" },
        ]}
      />
      <PageHeader
        title="Blog"
        description={
          "Practical articles on house plans, architectural drawings, plot sizes, building costs and the design process."
        }
        links={[
          { label: CTA.primary, href: ROUTES.newOrder },
          { label: "Browse all guides", href: ROUTES.guides },
        ]}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        {tags.length > 0 ? (
          <nav aria-label="Tags" className="mb-8 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={ROUTES.blogTag(tag)}
                className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted"
              >
                #{tag}
              </Link>
            ))}
          </nav>
        ) : null}

        {posts.length === 0 ? (
          <EmptyState
            icon={FileTextIcon}
            title="No posts yet"
            description="Articles will appear here once they are published. In the meantime, the guides have you covered."
            action={
              <Link
                href={ROUTES.guides}
                className="text-primary underline underline-offset-4"
              >
                Browse the guides
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
    </main>
  );
}
