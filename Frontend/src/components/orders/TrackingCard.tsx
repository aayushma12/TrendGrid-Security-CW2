import type { OrderDto } from "@/lib/api/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { DeliveryProgress } from "./DeliveryProgress";
import { OrderTimeline } from "./OrderTimeline";
import { fmtDate, isExceptionStatus } from "./statusConfig";

/**
 * Modern Amazon/Daraz/Shopify-style tracking result card: current status,
 * delivery progress, estimated delivery, shipping address, and the full
 * status timeline in one self-contained block.
 */
export function TrackingCard({ order }: { order: OrderDto }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 p-5 sm:p-6">
        <div>
          <div className="text-xs font-medium tracking-wide text-gray-400 uppercase">Tracking number</div>
          <div className="mt-0.5 font-mono text-lg font-semibold text-gray-900">{order.trackingNumber}</div>
          <div className="mt-1 text-sm text-gray-500">
            Order {order.orderNumber} · Placed {fmtDate(order.placedAt)}
          </div>
        </div>
        <OrderStatusBadge status={order.status} className="text-sm" />
      </div>

      <div className="border-b border-gray-100 p-5 sm:p-6">
        <DeliveryProgress status={order.status} />
        {!isExceptionStatus(order.status) && order.estimatedDelivery && (
          <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <span className="font-medium">Estimated delivery:</span> {fmtDate(order.estimatedDelivery)}
          </div>
        )}
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Delivery status</h3>
          <OrderTimeline status={order.status} history={order.statusHistory} />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Shipping to</h3>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
            <div className="font-medium text-gray-900">{order.shippingAddress.fullName}</div>
            <div className="mt-1">{order.shippingAddress.phone}</div>
            <div className="mt-1">
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
            </div>
            <div>
              {order.shippingAddress.city}
              {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} {order.shippingAddress.postalCode}
            </div>
            <div>{order.shippingAddress.country}</div>
          </div>

          <h3 className="mt-5 mb-3 text-sm font-semibold text-gray-900">Package</h3>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
            {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
            {order.items.reduce((s, i) => s + i.quantity, 0)} unit{order.items.reduce((s, i) => s + i.quantity, 0) === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </div>
  );
}
