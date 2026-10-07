import type { Metadata } from "next";

import { APP, ROUTES } from "@/config/constants";
import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  title: "Start an order",
  description: `Order a custom house design from ${APP.name}.`,
};

export default function NewOrderPage() {
  return (
    <main>
      <PageHeader
        title="Start your order"
        description="Six short steps — package, plot, requirements, style, files, review. Your progress is saved in this browser as you go."
      />
      <div className="mx-auto w-full max-w-3xl px-4 pb-20">
        <OrderForm />
      </div>
    </main>
  );
}
