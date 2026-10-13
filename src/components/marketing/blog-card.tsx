import Link from "next/link";

import { ROUTES } from "@/config/constants";

export type BlogCardData = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  readingMinutes: number;
  publishedAt: Date | null;
  coverImageId: string | null;
  author: { name: string | null };
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Blog card shared by the index, tag pages and the home strip (plan 6). */
export function BlogCard({ post }: { post: BlogCardData }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <Link
        href={ROUTES.blogPost(post.slug)}
        className="relative block aspect-[16/9] w-full bg-muted"
      >
        {post.coverImageId ? (
          // eslint-disable-next-line @next/next/no-img-element -- exact stored object
          <img
            src={`/api/posts/images/${post.coverImageId}`}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
        <h3 className="font-display text-xl font-medium leading-snug tracking-tight">
          <Link
            href={ROUTES.blogPost(post.slug)}
            className="text-foreground hover:text-primary"
          >
            {post.title}
          </Link>
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        {post.tags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={ROUTES.blogTag(tag)}
                className="rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-accent hover:text-accent-foreground"
              >
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
