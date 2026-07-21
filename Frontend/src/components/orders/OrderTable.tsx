import type { ReactNode } from "react";
import type { OrderDto } from "@/lib/api/types";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderStatusBadge";
import { fmtDate, formatMoney } from "./statusConfig";

interface OrderTableProps {
  orders: OrderDto[];
  /** Show a "Customer" column (admin view). */
  showCustomer?: boolean;
  customerLabel?: (order: OrderDto) => string;
  onRowClick?: (order: OrderDto) => void;
  renderActions?: (order: OrderDto) => ReactNode;
}

/**
 * Desktop table view of an order list. Pairs with OrderCard for the
 * responsive mobile layout — callers typically render OrderTable inside a
 * `hidden md:block` wrapper and OrderCard inside `md:hidden`.
 */
export function OrderTable({ orders, showCustomer, customerLabel, onRowClick, renderActions }: OrderTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium tracking-wide text-gray-500 uppercase">
            <th className="px-4 py-3">Order</th>
            {showCustomer && <th className="px-4 py-3">Customer</th>}
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Items</th>
            <th className="px-4 py-3 text-right">Total</th>
            {renderActions && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr
              key={order.id}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
              onClick={() => onRowClick?.(order)}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{order.orderNumber}</div>
                <div className="text-xs text-gray-400">{order.trackingNumber}</div>
              </td>
              {showCustomer && (
                <td className="px-4 py-3 text-gray-700">
                  {customerLabel?.(order) ?? order.shippingAddress.fullName}
                </td>
              )}
              <td className="px-4 py-3 text-gray-500">{fmtDate(order.placedAt)}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3">
                <PaymentStatusBadge status={order.paymentStatus} />
              </td>
              <td className="px-4 py-3 text-gray-500">{order.items.length}</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                {formatMoney(order.grandTotal, order.currency)}
              </td>
              {renderActions && (
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {renderActions(order)}
                </td>
              )}
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={showCustomer ? 8 : 7} className="px-4 py-10 text-center text-sm text-gray-400">
                No orders to show.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
