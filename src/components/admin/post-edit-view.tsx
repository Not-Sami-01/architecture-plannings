"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { PostForm } from "@/components/admin/post-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPost } from "@/hooks/admin/use-admin-post";

export function PostEditView() {
  const params = useParams<{ id: string }>();
  const { data, loadings } = useAdminPost(params.id);

  if (loadings.loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[46svh] w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Post not found.{" "}
        <Link href="/admin/blog" className="text-primary underline underline-offset-4">
          Back to posts
        </Link>
      </p>
    );
  }

  return <PostForm post={data} />;
}
