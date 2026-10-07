import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/config/constants";

type OrderStatusBadgeProps = {
  status: string;
};

const VARIANT_BY_STATUS: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  SUBMITTED: "secondary",
  QUOTED: "outline",
  AWAITING_ADVANCE: "outline",
  IN_DESIGN: "default",
  DRAFT_DELIVERED: "outline",
  REVISION_REQUESTED: "outline",
  AWAITING_FINAL_PAYMENT: "outline",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const label = ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
  const variant = VARIANT_BY_STATUS[status as OrderStatus] ?? "secondary";
  return <Badge variant={variant}>{label}</Badge>;
}
