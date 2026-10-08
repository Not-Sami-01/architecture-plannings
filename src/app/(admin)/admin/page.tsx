import { redirect } from "next/navigation";

import { ROUTES } from "@/config/constants";

/** /admin has no overview yet — land on the orders list (proxy/robots reference it). */
export default function AdminRootPage() {
  redirect(ROUTES.admin.orders);
}
