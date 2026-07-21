import type { OrderStatus } from "@/lib/api/types";
import { STATUS_LABEL, STATUS_TONE, TONE_CLASSES } from "./statusConfig";

export function OrderStatusBadge({ status, className = "" }: { status: OrderStatus; className?: string }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${TONE_CLASSES[tone]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const tone =
    status === "PAID" ? "green" : status === "FAILED" ? "red" : status === "REFUNDED" ? "gray" : "amber";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${TONE_CLASSES[tone]} ${className}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
