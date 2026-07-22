"use client";

import { useCallback, useEffect, useState } from "react";
import { fashionSrc } from "@/lib/fashion-images";
import type {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  Status,
  ReviewStatus,
  GiftCardStatus,
} from "@/lib/admin-data";

export { fashionSrc };

export function money(n: number, symbol = "Rs."): string {
  return symbol === "Rs." ? `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : `${symbol}${n.toFixed(2)}`;
}

/* --- badge colour maps --- */

const ORDER_TONE: Record<OrderStatus, string> = {
  pending: "amber",
  processing: "blue",
  packed: "purple",
  shipped: "blue",
  delivered: "green",
  cancelled: "red",
  refunded: "gray",
};
const PAY_TONE: Record<PaymentStatus, string> = {
  pending: "amber",
  paid: "green",
  refunded: "gray",
  failed: "red",
};
const FUL_TONE: Record<FulfillmentStatus, string> = {
  unfulfilled: "gray",
  partial: "amber",
  fulfilled: "green",
};
const PRODUCT_TONE: Record<Status, string> = {
  active: "green",
  draft: "amber",
  archived: "gray",
};
const REVIEW_TONE: Record<ReviewStatus, string> = {
  approved: "green",
  pending: "amber",
  rejected: "red",
};
const GIFTCARD_TONE: Record<GiftCardStatus, string> = {
  active: "green",
  redeemed: "gray",
  expired: "gray",
  disabled: "red",
};

export function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`adm-badge ${tone}`}>{children}</span>;
}

export const OrderBadge = ({ status }: { status: OrderStatus }) => (
  <Badge tone={ORDER_TONE[status]}>{status}</Badge>
);
export const PayBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge tone={PAY_TONE[status]}>{status}</Badge>
);
export const FulBadge = ({ status }: { status: FulfillmentStatus }) => (
  <Badge tone={FUL_TONE[status]}>{status}</Badge>
);
export const StatusBadge = ({ status }: { status: Status }) => (
  <Badge tone={PRODUCT_TONE[status]}>{status}</Badge>
);
export const ReviewBadge = ({ status }: { status: ReviewStatus }) => (
  <Badge tone={REVIEW_TONE[status]}>{status}</Badge>
);
export const GiftCardBadge = ({ status }: { status: GiftCardStatus }) => (
  <Badge tone={GIFTCARD_TONE[status]}>{status}</Badge>
);

/* --- toast --- */

export function useToast(): [string | null, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  const show = useCallback((m: string) => setMsg(m), []);
  return [msg, show];
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div className="adm-toast">{msg}</div>;
}

/* --- toggle switch --- */

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label className="adm-toggle" title={label} style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span />
    </label>
  );
}

/* --- confirm / prompt dialogs (custom-styled replacement for the browser's
 * native window.confirm / window.prompt, which can't be themed and look out
 * of place next to the rest of the admin UI) --- */

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the red "danger" style — use for deletes. */
  danger?: boolean;
}

export interface PromptOptions extends ConfirmOptions {
  placeholder?: string;
  defaultValue?: string;
  /** When true, the submit button stays disabled until the input is non-empty. */
  required?: boolean;
}

type DialogState =
  | ({ kind: "confirm"; opts: ConfirmOptions; resolve: (v: boolean) => void })
  | ({ kind: "prompt"; opts: PromptOptions; resolve: (v: string | null) => void })
  | null;

/**
 * Drop-in async replacement for `confirm()` / `window.prompt()`:
 *
 *   const { confirm, prompt, dialog } = useConfirmDialog();
 *   if (!(await confirm({ message: "Delete this?", danger: true }))) return;
 *   const note = await prompt({ message: "Add a note", placeholder: "Optional" });
 *
 * Render `{dialog}` once anywhere in the component tree (it portals nothing —
 * it's just conditionally-rendered JSX — so anywhere after other content is fine).
 */
export function useConfirmDialog(): {
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>;
  prompt: (opts: PromptOptions | string) => Promise<string | null>;
  dialog: React.ReactNode;
} {
  const [state, setState] = useState<DialogState>(null);
  const [value, setValue] = useState("");

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    const normalized: ConfirmOptions = typeof opts === "string" ? { message: opts } : opts;
    return new Promise<boolean>((resolve) => {
      setState({ kind: "confirm", opts: normalized, resolve });
    });
  }, []);

  const prompt = useCallback((opts: PromptOptions | string) => {
    const normalized: PromptOptions = typeof opts === "string" ? { message: opts } : opts;
    setValue(normalized.defaultValue ?? "");
    return new Promise<string | null>((resolve) => {
      setState({ kind: "prompt", opts: normalized, resolve });
    });
  }, []);

  function settle(result: boolean | string | null) {
    setState((current) => {
      if (!current) return current;
      if (current.kind === "confirm") current.resolve(Boolean(result));
      else current.resolve(typeof result === "string" ? result : null);
      return null;
    });
  }

  const canSubmit = state?.kind !== "prompt" || !state.opts.required || value.trim().length > 0;

  const dialog = state ? (
    <div
      className="adm-overlay adm-modal-center"
      onClick={() => settle(state.kind === "confirm" ? false : null)}
    >
      <div
        className="adm-modal adm-confirm-modal"
        style={{ width: "min(440px, 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="adm-modal-head">
          <h3>{state.opts.title ?? (state.kind === "prompt" ? "Enter a value" : "Are you sure?")}</h3>
        </div>
        <div className="adm-modal-body">
          <p className="adm-cell-sub" style={{ fontSize: 14, color: "var(--adm-text)", lineHeight: 1.5 }}>
            {state.opts.message}
          </p>
          {state.kind === "prompt" && (
            <input
              autoFocus
              className="adm-input"
              style={{ marginTop: 14 }}
              value={value}
              placeholder={state.opts.placeholder}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) settle(value);
              }}
            />
          )}
        </div>
        <div className="adm-modal-foot">
          <button className="adm-btn" onClick={() => settle(state.kind === "confirm" ? false : null)}>
            {state.opts.cancelLabel ?? "Cancel"}
          </button>
          <button
            className={`adm-btn${state.opts.danger ? " adm-btn-danger" : " adm-btn-primary"}`}
            disabled={!canSubmit}
            onClick={() => settle(state.kind === "confirm" ? true : value)}
          >
            {state.opts.confirmLabel ?? (state.kind === "prompt" ? "Submit" : "Delete")}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, prompt, dialog };
}
