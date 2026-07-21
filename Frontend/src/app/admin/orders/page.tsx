"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelOrder,
  deleteOrder,
  listOrders,
  refundOrder,
  updateOrder,
  updateOrderStatus,
  updatePaymentStatus,
} from "@/lib/api/orders";
import { formatAuthError } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import type { OrderAddress, OrderDto, OrderStatus, PaymentStatus } from "@/lib/api/types";
import { Toast, useConfirmDialog, useToast } from "@/components/admin/ui";
import {
  ALL_STATUSES,
  OrderEmptyState,
  OrderErrorState,
  OrderFilters,
  OrderListSkeleton,
  OrderStatusBadge,
  OrderTable,
  OrderTimeline,
  Pagination,
  PaymentStatusBadge,
  SearchBar,
  StatusUpdateModal,
  fmtDate,
  fmtDateTime,
  formatMoney,
} from "@/components/orders";

/** Mirrors NDH.Trendgrid.Api ADDRESS_LOCKED_STATUSES — shipping address can't change after these. */
const ADDRESS_LOCKED_STATUSES = new Set<OrderStatus>([
  "READY_FOR_SHIPMENT", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "RETURNED", "REFUNDED",
]);
const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];
const CANCELLABLE = new Set<OrderStatus>(["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "READY_FOR_SHIPMENT"]);
const PAGE_SIZE = 10;

function printInvoice(order: OrderDto) {
  const win = window.open("", "_blank", "width=800,height=1000");
  if (!win) return;
  const rows = order.items
    .map(
      (it) => `<tr>
        <td>${it.productName}${it.colorName ? ` · ${it.colorName}` : ""}${it.sizeName ? ` · ${it.sizeName}` : ""}</td>
        <td>${it.variantSku}</td>
        <td style="text-align:center">${it.quantity}</td>
        <td style="text-align:right">${formatMoney(it.unitPrice, order.currency)}</td>
        <td style="text-align:right">${formatMoney(it.lineTotal, order.currency)}</td>
      </tr>`,
    )
    .join("");
  win.document.write(`<!DOCTYPE html>
    <html><head><title>Invoice ${order.invoiceNumber}</title>
    <style>
      body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 40px; color: #111; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { padding: 8px 6px; border-bottom: 1px solid #eee; font-size: 13px; text-align: left; }
      th { color: #888; font-weight: 600; text-transform: uppercase; font-size: 11px; }
      .totals td { border: none; }
      .grand { font-weight: 700; font-size: 15px; border-top: 2px solid #111 !important; }
      .addr { font-size: 13px; color: #333; line-height: 1.6; }
      .grid { display: flex; justify-content: space-between; gap: 24px; margin-top: 20px; }
    </style></head>
    <body>
      <h1>Invoice ${order.invoiceNumber}</h1>
      <div class="sub">Order ${order.orderNumber} · Tracking ${order.trackingNumber} · Placed ${fmtDate(order.placedAt)}</div>
      <div class="grid">
        <div>
          <strong>Bill to</strong>
          <div class="addr">
            ${order.billingAddress.fullName}<br/>
            ${order.billingAddress.addressLine1}${order.billingAddress.addressLine2 ? `, ${order.billingAddress.addressLine2}` : ""}<br/>
            ${order.billingAddress.city}${order.billingAddress.state ? `, ${order.billingAddress.state}` : ""} ${order.billingAddress.postalCode}<br/>
            ${order.billingAddress.country}
          </div>
        </div>
        <div>
          <strong>Ship to</strong>
          <div class="addr">
            ${order.shippingAddress.fullName}<br/>
            ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}<br/>
            ${order.shippingAddress.city}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} ${order.shippingAddress.postalCode}<br/>
            ${order.shippingAddress.country}
          </div>
        </div>
      </div>
      <table>
        <thead><tr><th>Item</th><th>SKU</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="totals"><td colspan="4">Subtotal</td><td style="text-align:right">${formatMoney(order.subtotal, order.currency)}</td></tr>
          ${order.discountAmount > 0 ? `<tr class="totals"><td colspan="4">Discount</td><td style="text-align:right">-${formatMoney(order.discountAmount, order.currency)}</td></tr>` : ""}
          ${order.couponCode ? `<tr class="totals"><td colspan="4">Coupon · ${order.couponCode}</td><td style="text-align:right">-${formatMoney(order.couponDiscount, order.currency)}</td></tr>` : ""}
          <tr class="totals"><td colspan="4">Shipping</td><td style="text-align:right">${formatMoney(order.shippingCharge, order.currency)}</td></tr>
          ${order.taxAmount > 0 ? `<tr class="totals"><td colspan="4">Tax</td><td style="text-align:right">${formatMoney(order.taxAmount, order.currency)}</td></tr>` : ""}
          <tr class="totals grand"><td colspan="4">Total</td><td style="text-align:right">${formatMoney(order.grandTotal, order.currency)}</td></tr>
        </tfoot>
      </table>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [active, setActive] = useState<OrderDto | null>(null);
  const [editingAddress, setEditingAddress] = useState<OrderDto | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [statusModalOrder, setStatusModalOrder] = useState<OrderDto | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const { confirm, prompt, dialog } = useConfirmDialog();

  // Debounce the search box (300ms) so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Reset to page 1 whenever the filter/search changes.
  useEffect(() => {
    setPage(1);
  }, [filter, debouncedQuery]);

  // Stale-response guard: ignore a response if a newer request has since been issued.
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await listOrders({
        page, limit: PAGE_SIZE,
        status: filter === "all" ? undefined : filter,
        search: debouncedQuery || undefined,
      });
      if (requestRef.current !== requestId) return; // a newer request superseded this one
      setOrders(res.data);
      setTotal(res.meta?.total ?? res.data.length);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch (err) {
      if (requestRef.current !== requestId) return;
      setError(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [page, filter, debouncedQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyUpdated(updated: OrderDto) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setActive((a) => (a && a.id === updated.id ? updated : a));
  }

  async function submitStatusUpdate(order: OrderDto, status: OrderStatus, note: string) {
    setSavingStatus(true);
    try {
      const res = await updateOrderStatus(order.id, status, note || undefined);
      applyUpdated(res.data);
      showToast(`${order.orderNumber} → ${status.replaceAll("_", " ").toLowerCase()}`);
      setStatusModalOrder(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setSavingStatus(false);
    }
  }

  async function changePayment(order: OrderDto, paymentStatus: PaymentStatus) {
    try {
      const res = await updatePaymentStatus(order.id, paymentStatus);
      applyUpdated(res.data);
      showToast(`${order.orderNumber} payment marked ${paymentStatus}`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    }
  }

  async function handleCancel(order: OrderDto) {
    const reason = await prompt({
      title: "Cancel order",
      message: `Cancelling ${order.orderNumber}. You can add a reason for the record.`,
      placeholder: "Reason for cancellation (optional)",
      confirmLabel: "Cancel order",
      danger: true,
    });
    if (reason === null) return;
    setBusyId(order.id);
    try {
      const res = await cancelOrder(order.id, reason || undefined);
      applyUpdated(res.data);
      showToast(`${order.orderNumber} cancelled`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRefund(order: OrderDto) {
    const note = await prompt({
      title: "Refund order",
      message: `Refund ${order.orderNumber}? This marks the order and payment as refunded.`,
      placeholder: "Refund note (optional)",
      confirmLabel: "Refund",
      danger: true,
    });
    if (note === null) return;
    setBusyId(order.id);
    try {
      const res = await refundOrder(order.id, note || undefined);
      applyUpdated(res.data);
      showToast(`${order.orderNumber} refunded`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(order: OrderDto) {
    if (
      !(await confirm({
        title: "Delete order",
        message: `Delete order ${order.orderNumber}? This is a soft delete kept for accounting.`,
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    try {
      await deleteOrder(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setActive((a) => (a && a.id === order.id ? null : a));
      showToast(`${order.orderNumber} deleted`);
      void load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    }
  }

  async function saveAddress(
    order: OrderDto,
    shippingAddress: OrderAddress,
    billingAddress: OrderAddress,
    customerNote: string,
  ) {
    setSavingAddress(true);
    try {
      const res = await updateOrder(order.id, {
        shippingAddress,
        billingAddress,
        customerNote: customerNote.trim() ? customerNote.trim() : null,
      });
      applyUpdated(res.data);
      showToast(`${order.orderNumber} details updated`);
      setEditingAddress(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setSavingAddress(false);
    }
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Orders</h2>
          <p>Loaded from the Trendgrid API. Track, fulfil, and manage every customer order.</p>
        </div>
        <div className="adm-head-actions">
          <SearchBar value={query} onChange={setQuery} placeholder="Search order #, tracking # or customer…" className="w-72" />
          <button className="adm-btn" onClick={() => void load()} disabled={loading}>Refresh</button>
        </div>
      </div>

      <div className="adm-stats">
        <div className="adm-stat"><div className="adm-stat-label">Total orders</div><div className="adm-stat-value">{total}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Page</div><div className="adm-stat-value">{page} / {totalPages}</div></div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <OrderFilters value={filter} onChange={setFilter} statuses={ALL_STATUSES} />
      </div>

      {loading && <OrderListSkeleton rows={6} />}

      {!loading && error && <OrderErrorState message={error} onRetry={() => void load()} />}

      {!loading && !error && orders.length === 0 && (
        <OrderEmptyState
          title="No orders match"
          message="Try a different filter or search term."
        />
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          <OrderTable
            orders={orders}
            showCustomer
            customerLabel={(o) => o.shippingAddress.fullName}
            onRowClick={(o) => setActive(o)}
            renderActions={(o) => (
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button className="adm-btn adm-btn-sm" onClick={() => setActive(o)}>View</button>
                <button
                  className="adm-btn adm-btn-sm adm-btn-primary"
                  onClick={() => setStatusModalOrder(o)}
                  disabled={busyId === o.id}
                >
                  Update
                </button>
              </div>
            )}
          />
          <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </>
      )}

      {active && (
        <OrderDrawer
          order={active}
          busy={busyId === active.id}
          onClose={() => setActive(null)}
          onUpdateStatus={() => setStatusModalOrder(active)}
          onPayment={(status) => void changePayment(active, status)}
          onCancel={() => void handleCancel(active)}
          onRefund={() => void handleRefund(active)}
          onDelete={() => void remove(active)}
          onEdit={() => setEditingAddress(active)}
          onPrint={() => printInvoice(active)}
        />
      )}

      {statusModalOrder && (
        <StatusUpdateModal
          order={statusModalOrder}
          saving={savingStatus}
          onClose={() => !savingStatus && setStatusModalOrder(null)}
          onSubmit={(status, note) => void submitStatusUpdate(statusModalOrder, status, note)}
        />
      )}

      {editingAddress && (
        <OrderEditModal
          order={editingAddress}
          saving={savingAddress}
          onClose={() => !savingAddress && setEditingAddress(null)}
          onSave={(shipping, billing, note) => void saveAddress(editingAddress, shipping, billing, note)}
        />
      )}
      <Toast msg={toast} />
      {dialog}
    </>
  );
}

function OrderDrawer({
  order,
  busy,
  onClose,
  onUpdateStatus,
  onPayment,
  onCancel,
  onRefund,
  onDelete,
  onEdit,
  onPrint,
}: {
  order: OrderDto;
  busy: boolean;
  onClose: () => void;
  onUpdateStatus: () => void;
  onPayment: (status: PaymentStatus) => void;
  onCancel: () => void;
  onRefund: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPrint: () => void;
}) {
  const sameAddress = JSON.stringify(order.shippingAddress) === JSON.stringify(order.billingAddress);

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="adm-drawer-head">
          <div>
            <h3>{order.orderNumber}</h3>
            <span className="adm-cell-sub">
              {order.invoiceNumber} · {order.trackingNumber} · {fmtDateTime(order.placedAt)}
            </span>
          </div>
          <button className="adm-close" onClick={onClose}>✕</button>
        </div>
        <div className="adm-drawer-body">
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>

          {order.estimatedDelivery && (
            <div className="adm-card" style={{ padding: 12, marginBottom: 16, background: "#eff6ff" }}>
              <strong>Estimated delivery:</strong> {fmtDate(order.estimatedDelivery)}
            </div>
          )}

          <dl className="adm-def">
            <dt>Customer</dt><dd>{order.shippingAddress.fullName}</dd>
            <dt>Phone</dt><dd>{order.shippingAddress.phone}</dd>
            <dt>Ship to</dt>
            <dd>
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
              , {order.shippingAddress.city}
              {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} {order.shippingAddress.postalCode}, {order.shippingAddress.country}
            </dd>
            {!sameAddress && (
              <>
                <dt>Bill to</dt>
                <dd>
                  {order.billingAddress.addressLine1}
                  {order.billingAddress.addressLine2 ? `, ${order.billingAddress.addressLine2}` : ""}
                  , {order.billingAddress.city}
                  {order.billingAddress.state ? `, ${order.billingAddress.state}` : ""} {order.billingAddress.postalCode}, {order.billingAddress.country}
                </dd>
              </>
            )}
            {order.customerNote && (<><dt>Note</dt><dd>{order.customerNote}</dd></>)}
            {order.cancelReason && (<><dt>Cancel reason</dt><dd>{order.cancelReason}</dd></>)}
            {order.returnReason && (<><dt>Return reason</dt><dd>{order.returnReason}</dd></>)}
          </dl>

          <div className="adm-card-head" style={{ padding: "0 0 10px", borderBottom: "1px solid var(--adm-border)" }}><h3>Items</h3></div>
          <div style={{ margin: "6px 0 14px" }}>
            {order.items.map((it) => (
              <div key={it.id} className="adm-line">
                <span>
                  {it.productName}
                  <span className="adm-cell-sub"> · {it.variantSku}{it.colorName ? ` · ${it.colorName}` : ""}{it.sizeName ? ` · ${it.sizeName}` : ""} × {it.quantity}</span>
                </span>
                <span style={{ fontWeight: 600 }}>{formatMoney(it.lineTotal, order.currency)}</span>
              </div>
            ))}
            <div className="adm-line"><span>Subtotal</span><span>{formatMoney(order.subtotal, order.currency)}</span></div>
            {order.discountAmount > 0 && <div className="adm-line"><span>Discount</span><span>-{formatMoney(order.discountAmount, order.currency)}</span></div>}
            {order.couponCode && <div className="adm-line"><span>Coupon · {order.couponCode}</span><span>-{formatMoney(order.couponDiscount, order.currency)}</span></div>}
            <div className="adm-line"><span>Shipping</span><span>{formatMoney(order.shippingCharge, order.currency)}</span></div>
            {order.taxAmount > 0 && <div className="adm-line"><span>Tax</span><span>{formatMoney(order.taxAmount, order.currency)}</span></div>}
            <div className="adm-line" style={{ fontWeight: 700 }}>
              <span>Total</span><span>{formatMoney(order.grandTotal, order.currency)}</span>
            </div>
          </div>

          <div className="adm-field">
            <label>Update payment</label>
            <select className="adm-select" value={order.paymentStatus} onChange={(e) => onPayment(e.target.value as PaymentStatus)}>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="adm-card-head" style={{ padding: "16px 0 10px", borderBottom: "1px solid var(--adm-border)" }}><h3>Status history</h3></div>
          <div style={{ margin: "12px 0" }}>
            <OrderTimeline status={order.status} history={order.statusHistory} />
          </div>

          <div style={{ marginTop: 18, borderTop: "1px solid var(--adm-border)", paddingTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="adm-btn adm-btn-primary" onClick={onUpdateStatus} disabled={busy}>Update status</button>
            {CANCELLABLE.has(order.status) && (
              <button className="adm-btn adm-btn-danger" onClick={onCancel} disabled={busy}>Cancel order</button>
            )}
            {order.status === "RETURNED" && (
              <button className="adm-btn" onClick={onRefund} disabled={busy}>Refund</button>
            )}
            <button className="adm-btn" onClick={onEdit} disabled={busy}>Edit address / note</button>
            <button className="adm-btn" onClick={onPrint}>Print invoice</button>
            <button className="adm-btn adm-btn-danger" onClick={onDelete} disabled={busy}>Delete order</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderEditModal({
  order,
  saving,
  onClose,
  onSave,
}: {
  order: OrderDto;
  saving: boolean;
  onClose: () => void;
  onSave: (shippingAddress: OrderAddress, billingAddress: OrderAddress, customerNote: string) => void;
}) {
  const [shipping, setShipping] = useState<OrderAddress>(order.shippingAddress);
  const [billing, setBilling] = useState<OrderAddress>(order.billingAddress);
  const [sameAsShipping, setSameAsShipping] = useState(
    JSON.stringify(order.shippingAddress) === JSON.stringify(order.billingAddress),
  );
  const [note, setNote] = useState(order.customerNote ?? "");

  const shippingLocked = ADDRESS_LOCKED_STATUSES.has(order.status);

  function setShippingField<K extends keyof OrderAddress>(key: K, value: OrderAddress[K]) {
    setShipping((p) => ({ ...p, [key]: value }));
  }
  function setBillingField<K extends keyof OrderAddress>(key: K, value: OrderAddress[K]) {
    setBilling((p) => ({ ...p, [key]: value }));
  }

  function addressFields(
    addr: OrderAddress,
    setField: <K extends keyof OrderAddress>(key: K, value: OrderAddress[K]) => void,
    disabled: boolean,
  ) {
    return (
      <>
        <div className="adm-form-row">
          <div className="adm-field"><label>Full name</label><input className="adm-input" value={addr.fullName} disabled={disabled} onChange={(e) => setField("fullName", e.target.value)} /></div>
          <div className="adm-field"><label>Phone</label><input className="adm-input" value={addr.phone} disabled={disabled} onChange={(e) => setField("phone", e.target.value)} /></div>
        </div>
        <div className="adm-field"><label>Address line 1</label><input className="adm-input" value={addr.addressLine1} disabled={disabled} onChange={(e) => setField("addressLine1", e.target.value)} /></div>
        <div className="adm-field"><label>Address line 2</label><input className="adm-input" value={addr.addressLine2 ?? ""} disabled={disabled} onChange={(e) => setField("addressLine2", e.target.value)} placeholder="Optional" /></div>
        <div className="adm-form-row">
          <div className="adm-field"><label>City</label><input className="adm-input" value={addr.city} disabled={disabled} onChange={(e) => setField("city", e.target.value)} /></div>
          <div className="adm-field"><label>State</label><input className="adm-input" value={addr.state ?? ""} disabled={disabled} onChange={(e) => setField("state", e.target.value)} placeholder="Optional" /></div>
        </div>
        <div className="adm-form-row">
          <div className="adm-field"><label>Postal code</label><input className="adm-input" value={addr.postalCode} disabled={disabled} onChange={(e) => setField("postalCode", e.target.value)} /></div>
          <div className="adm-field"><label>Country</label><input className="adm-input" value={addr.country} disabled={disabled} onChange={(e) => setField("country", e.target.value)} /></div>
        </div>
      </>
    );
  }

  return (
    <div className="adm-overlay adm-modal-center" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>Edit · {order.orderNumber}</h3>
          <button className="adm-close" onClick={onClose} disabled={saving}>✕</button>
        </div>
        <div className="adm-modal-body">
          <h4 style={{ margin: "0 0 8px" }}>Shipping address</h4>
          {shippingLocked && (
            <span className="adm-hint">Shipping address is locked once an order is ready to ship ({order.status.toLowerCase().replace(/_/g, " ")}).</span>
          )}
          {addressFields(shipping, setShippingField, shippingLocked)}

          <div className="adm-switchrow" style={{ marginTop: 14 }}>
            <div className="adm-switchrow-info"><strong>Billing same as shipping</strong></div>
            <input
              type="checkbox"
              checked={sameAsShipping}
              onChange={(e) => {
                setSameAsShipping(e.target.checked);
                if (e.target.checked) setBilling(shipping);
              }}
            />
          </div>
          {!sameAsShipping && (
            <>
              <h4 style={{ margin: "14px 0 8px" }}>Billing address</h4>
              {addressFields(billing, setBillingField, false)}
            </>
          )}

          <div className="adm-field" style={{ marginTop: 8 }}>
            <label>Customer note</label>
            <textarea className="adm-textarea" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        </div>
        <div className="adm-modal-foot">
          <button className="adm-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="adm-btn adm-btn-primary"
            disabled={saving}
            onClick={() => onSave(shipping, sameAsShipping ? shipping : billing, note)}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
