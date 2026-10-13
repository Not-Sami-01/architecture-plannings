import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PostsTable } from "@/components/admin/posts-table";

export const metadata = { title: "Blog — Admin" };

export default function AdminBlogPage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drafts and published posts shown on /blog, with tags and SEO metadata.
          </p>
        </div>
        <Button render={<Link href="/admin/blog/new" />}>
          <PlusIcon data-icon="inline-start" />
          New post
        </Button>
      </div>
      <PostsTable />
    </main>
  );
}
