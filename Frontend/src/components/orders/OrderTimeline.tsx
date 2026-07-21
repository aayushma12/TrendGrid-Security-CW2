import type { OrderStatus, OrderStatusHistoryEntryDto } from "@/lib/api/types";
import {
  EXCEPTION_STATUSES, ORDER_STATUS_FLOW, STATUS_LABEL, fmtDateTime, isExceptionStatus,
} from "./statusConfig";

interface OrderTimelineProps {
  /** Current order status. */
  status: OrderStatus;
  /** Full append-only status history, oldest first (as returned by the API). */
  history: OrderStatusHistoryEntryDto[];
}

/**
 * Reusable vertical timeline: ✔ completed steps highlighted, ○ pending steps
 * dimmed, with the timestamp + note pulled from statusHistory when available.
 * If the order took an exception path (cancelled/returned/refunded/failed),
 * that's rendered as a final red/gray step instead of the remaining happy-path steps.
 */
export function OrderTimeline({ status, history }: OrderTimelineProps) {
  const historyByStatus = new Map<OrderStatus, OrderStatusHistoryEntryDto>();
  for (const h of history) {
    // Keep the earliest entry per status (first time it was reached).
    if (!historyByStatus.has(h.status)) historyByStatus.set(h.status, h);
  }

  const exceptionEntry = history.find((h) => EXCEPTION_STATUSES.includes(h.status));
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);
  const reachedIndex = exceptionEntry
    ? ORDER_STATUS_FLOW.findIndex((s) => s === exceptionEntry.status) - 1
    : currentIndex;

  const steps = ORDER_STATUS_FLOW.map((s, i) => ({
    status: s,
    label: STATUS_LABEL[s],
    entry: historyByStatus.get(s),
    completed: exceptionEntry ? i <= reachedIndex : i <= currentIndex,
    isCurrent: !exceptionEntry && i === currentIndex,
  }));

  return (
    <ol className="relative flex flex-col gap-0" role="list" aria-label="Order status timeline">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1 && !exceptionEntry;
        return (
          <li key={step.status} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden="true"
                className={`absolute left-[11px] top-6 h-full w-0.5 ${step.completed ? "bg-green-500" : "bg-gray-200"}`}
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                step.completed
                  ? "border-green-500 bg-green-500 text-white"
                  : step.isCurrent
                    ? "border-blue-500 bg-white text-blue-500"
                    : "border-gray-300 bg-white text-gray-300"
              }`}
            >
              {step.completed ? "✓" : "○"}
            </span>
            <div className="flex-1 pt-0.5">
              <div className={`text-sm font-medium ${step.completed ? "text-gray-900" : "text-gray-400"}`}>
                {step.label}
              </div>
              {step.entry && (
                <div className="mt-0.5 text-xs text-gray-500">
                  {fmtDateTime(step.entry.updatedAt)}
                  {step.entry.note ? ` · ${step.entry.note}` : ""}
                </div>
              )}
            </div>
          </li>
        );
      })}

      {exceptionEntry && (
        <li className="relative flex gap-3">
          <span
            className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
              exceptionEntry.status === "REFUNDED"
                ? "border-gray-400 bg-gray-400 text-white"
                : "border-red-500 bg-red-500 text-white"
            }`}
          >
            {exceptionEntry.status === "CANCELLED" ? "✕" : "!"}
          </span>
          <div className="flex-1 pt-0.5">
            <div className="text-sm font-medium text-gray-900">{STATUS_LABEL[exceptionEntry.status]}</div>
            <div className="mt-0.5 text-xs text-gray-500">
              {fmtDateTime(exceptionEntry.updatedAt)}
              {exceptionEntry.note ? ` · ${exceptionEntry.note}` : ""}
            </div>
          </div>
        </li>
      )}

      {!isExceptionStatus(status) && history.length === 0 && (
        <li className="text-xs text-gray-400">No history recorded yet.</li>
      )}
    </ol>
  );
}
