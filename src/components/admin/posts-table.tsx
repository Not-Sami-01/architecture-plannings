"use client";

import Link from "next/link";
import { useState } from "react";
import { FileTextIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { POST_STATUS_LABELS } from "@/config/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminPosts } from "@/hooks/admin/use-admin-posts";
import { useDeletePost, usePublishPost } from "@/hooks/admin/use-admin-post-mutations";

export function PostsTable() {
  const { data, loadings } = useAdminPosts({ page: 1, pageSize: 50 });
  const { actions: publishActions, loadings: publishLoadings } = usePublishPost();
  const { actions: deleteActions, loadings: deleteLoadings } = useDeletePost();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (loadings.loading) {
    return (
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title="No posts yet"
        description="Write your first post to start the blog."
        action={
          <Button render={<Link href="/admin/blog/new" />}>
            <PlusIcon data-icon="inline-start" />
            New post
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Link
                    href={`/admin/blog/${post.id}`}
                    className="font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                    {POST_STATUS_LABELS[post.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(post.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={
                        <Link href={`/admin/blog/${post.id}`} aria-label="Edit" />
                      }
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={publishLoadings.publishing}
                      onClick={() =>
                        publishActions.publish({
                          id: post.id,
                          publish: post.status !== "PUBLISHED",
                        })
                      }
                    >
                      {post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={deleteLoadings.deleting}
                      onClick={() => setDeletingId(post.id)}
                      aria-label="Delete"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>
              The post and its cover image will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteLoadings.deleting}
              onClick={async () => {
                if (!deletingId) return;
                await deleteActions.remove(deletingId);
                setDeletingId(null);
              }}
            >
              {deleteLoadings.deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
