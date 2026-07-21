import type { OrderStatus } from "@/lib/api/types";
import { ORDER_STATUS_FLOW, STATUS_LABEL, isExceptionStatus, statusProgressIndex } from "./statusConfig";

/**
 * Horizontal progress bar representing overall delivery progress based on
 * the current status. Renders a neutral "derailed" state for exception
 * statuses (cancelled/returned/refunded/failed) instead of a percentage.
 */
export function DeliveryProgress({ status }: { status: OrderStatus }) {
  if (isExceptionStatus(status)) {
    const tone = status === "REFUNDED" ? "bg-gray-400" : "bg-red-500";
    return (
      <div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full w-full ${tone}`} />
        </div>
        <div className="mt-2 text-xs font-medium text-gray-600">{STATUS_LABEL[status]}</div>
      </div>
    );
  }

  const index = statusProgressIndex(status);
  const total = ORDER_STATUS_FLOW.length;
  const pct = total <= 1 ? 100 : Math.round((index / (total - 1)) * 100);

  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span className="font-medium text-gray-700">{STATUS_LABEL[status]}</span>
        <span>{pct}% complete</span>
      </div>
    </div>
  );
}
