"use client";

import { useState } from "react";
import type { OrderDto, OrderStatus } from "@/lib/api/types";
import { ORDER_TRANSITIONS, STATUS_LABEL } from "./statusConfig";

interface StatusUpdateModalProps {
  order: OrderDto;
  saving: boolean;
  onClose: () => void;
  onSubmit: (status: OrderStatus, note: string) => void;
}

/**
 * Admin modal: pick a new status from the allowed next steps and add a note.
 * Caller is responsible for the actual API call + toast + refresh; this
 * component only collects and validates the input.
 */
export function StatusUpdateModal({ order, saving, onClose, onSubmit }: StatusUpdateModalProps) {
  const nextStatuses = ORDER_TRANSITIONS[order.status] ?? [];
  const [status, setStatus] = useState<OrderStatus | "">(nextStatuses[0] ?? "");
  const [note, setNote] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-update-title"
      >
        <div className="flex items-center justify-between">
          <h2 id="status-update-title" className="text-lg font-semibold text-gray-900">
            Update order status
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {order.orderNumber} · currently <span className="font-medium">{STATUS_LABEL[order.status]}</span>
        </p>

        {nextStatuses.length === 0 ? (
          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            This order is in a final state — no further status transitions are available.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="new-status" className="mb-1.5 block text-sm font-medium text-gray-700">
                New status
              </label>
              <select
                id="new-status"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
              >
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status-note" className="mb-1.5 block text-sm font-medium text-gray-700">
                Note <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                id="status-note"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                rows={3}
                placeholder="e.g. Order dispatched from warehouse"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {nextStatuses.length > 0 && (
            <button
              type="button"
              disabled={saving || !status}
              onClick={() => status && onSubmit(status, note.trim())}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Updating…" : "Update status"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
