import { PostForm } from "@/components/admin/post-form";

export const metadata = { title: "New post — Admin" };

export default function AdminBlogNewPage() {
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New post</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Starts as a draft — publish when the content and SEO look right.
        </p>
      </div>
      <PostForm post={null} />
    </main>
  );
}
