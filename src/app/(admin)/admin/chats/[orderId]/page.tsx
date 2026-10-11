import { AdminChatThreadView } from "@/components/admin/admin-chat-thread-view";

export const metadata = { title: "Chat — Admin" };

export default async function AdminChatThreadPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <AdminChatThreadView orderId={orderId} />;
}
