import type { Metadata } from "next";

import { AdminProceedView } from "@/components/admin/admin-proceed-view";

export const metadata: Metadata = {
  title: "Proceed order — Admin",
};

type ProceedPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProceedPage({ params }: ProceedPageProps) {
  const { id } = await params;
  return (
    <main className="flex flex-col gap-6">
      <AdminProceedView orderId={id} />
    </main>
  );
}
