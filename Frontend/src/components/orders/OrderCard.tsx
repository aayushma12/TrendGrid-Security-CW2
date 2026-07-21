import Link from "next/link";
import type { OrderDto } from "@/lib/api/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { fmtDate, formatMoney } from "./statusConfig";

/**
 * Compact order summary card — used on the customer Order History page
 * (mobile-first; the table view is used at wider breakpoints via OrderTable).
 */
export function OrderCard({ order, href }: { order: OrderDto; href: string }) {
  const itemsLabel = order.items
    .slice(0, 2)
    .map((i) => i.productName)
    .join(", ");
  const extra = order.items.length > 2 ? ` +${order.items.length - 2} more` : "";

  return (
    <Link
      href={href}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900">{order.orderNumber}</div>
          <div className="mt-0.5 text-xs text-gray-500">Placed {fmtDate(order.placedAt)}</div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="mt-3 text-sm text-gray-600">
        {itemsLabel}
        {extra}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-400">
          {order.items.length} item{order.items.length === 1 ? "" : "s"}
        </span>
        <span className="font-semibold text-gray-900">{formatMoney(order.grandTotal, order.currency)}</span>
      </div>
    </Link>
  );
}
