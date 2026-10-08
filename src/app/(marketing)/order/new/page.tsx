import type { Metadata } from "next";
import { Suspense } from "react";

import { APP } from "@/config/constants";
import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Start an order",
  description: `Order a custom house design from ${APP.name}.`,
  robots: { index: false, follow: false },
};

export default function NewOrderPage() {
  return (
    <main>
      <PageHeader
        title="Start your order"
        description="Six short steps — package, plot, requirements, style, files, review. Your progress is saved in this browser as you go."
      />
      <div className="mx-auto w-full max-w-3xl px-4 pb-20">
        {/* OrderForm reads useSearchParams (package prefill) — needs a Suspense boundary for prerender. */}
        <Suspense
          fallback={
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          }
        >
          <OrderForm />
        </Suspense>
      </div>
    </main>
  );
}
