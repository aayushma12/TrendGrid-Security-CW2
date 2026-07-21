import type { OrderStatus } from "@/lib/api/types";
import { ALL_STATUSES, STATUS_LABEL } from "./statusConfig";

interface OrderFiltersProps {
  value: OrderStatus | "all";
  onChange: (status: OrderStatus | "all") => void;
  counts?: Partial<Record<OrderStatus | "all", number>>;
  /** Restrict the pill set (e.g. hide admin-only exception statuses on a simple customer view). */
  statuses?: OrderStatus[];
}

/** Reusable status-filter pill row, with optional per-status counts. */
export function OrderFilters({ value, onChange, counts, statuses = ALL_STATUSES }: OrderFiltersProps) {
  const options: Array<OrderStatus | "all"> = ["all", ...statuses];

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
              active
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {opt === "all" ? "All" : STATUS_LABEL[opt]}
            {counts?.[opt] !== undefined && (
              <span className={`ml-1.5 ${active ? "text-gray-300" : "text-gray-400"}`}>{counts[opt]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
