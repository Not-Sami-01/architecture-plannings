import { PostEditView } from "@/components/admin/post-edit-view";

export const metadata = { title: "Edit post — Admin" };

export default function AdminBlogEditPage() {
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Edit post</h1>
      </div>
      <PostEditView />
    </main>
  );
}
