"use client";

import { useState } from "react";
import { CHECKOUT_SETTINGS, type CheckoutSettings } from "@/lib/admin-data";
import { Toggle, Toast, useToast, money } from "@/components/admin/ui";

export default function CheckoutAdmin() {
  const [s, setS] = useState<CheckoutSettings>(CHECKOUT_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [toast, showToast] = useToast();

  function patch(p: Partial<CheckoutSettings>) {
    setS((prev) => ({ ...prev, ...p }));
    setDirty(true);
  }
  function togglePayment(key: string, enabled: boolean) {
    setS((prev) => ({ ...prev, payments: prev.payments.map((p) => (p.key === key ? { ...p, enabled } : p)) }));
    setDirty(true);
  }
  function patchField(key: string, p: Partial<{ enabled: boolean; required: boolean }>) {
    setS((prev) => ({ ...prev, fields: prev.fields.map((f) => (f.key === key ? { ...f, ...p } : f)) }));
    setDirty(true);
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Checkout</h2>
          <p>Control shipping, tax, payment methods and the fields customers fill in.</p>
        </div>
        <div className="adm-head-actions">
          <a href="/checkout" target="_blank" rel="noreferrer" className="adm-btn">Preview checkout ↗</a>
          <button className="adm-btn adm-btn-primary" disabled={!dirty} onClick={() => { setDirty(false); showToast("Checkout settings saved (demo)"); }}>
            Save changes
          </button>
        </div>
      </div>

      <div className="adm-grid-2">
        {/* Shipping & tax */}
        <div className="adm-card">
          <div className="adm-card-head"><div><h3>Shipping & tax</h3><p>Rates applied at checkout</p></div></div>
          <div className="adm-card-body">
            <div className="adm-form-row">
              <div className="adm-field">
                <label>Flat shipping rate</label>
                <input className="adm-input" type="number" value={s.flatShipping} onChange={(e) => patch({ flatShipping: Number(e.target.value) })} />
              </div>
              <div className="adm-field">
                <label>Free shipping over</label>
                <input className="adm-input" type="number" value={s.freeShippingOver} onChange={(e) => patch({ freeShippingOver: Number(e.target.value) })} />
              </div>
            </div>
            <div className="adm-form-row">
              <div className="adm-field">
                <label>Currency</label>
                <select className="adm-select" value={s.currency} onChange={(e) => patch({ currency: e.target.value, currencySymbol: e.target.value === "USD" ? "$" : e.target.value === "EUR" ? "€" : e.target.value === "GBP" ? "£" : "$" })}>
                  <option>USD</option><option>EUR</option><option>GBP</option><option>NPR</option>
                </select>
              </div>
              <div className="adm-field">
                <label>Tax rate (%)</label>
                <input className="adm-input" type="number" value={s.taxRate} onChange={(e) => patch({ taxRate: Number(e.target.value) })} />
              </div>
            </div>
            <p className="adm-hint">Preview: orders under {money(s.freeShippingOver, s.currencySymbol)} pay {money(s.flatShipping, s.currencySymbol)} shipping{s.taxRate > 0 ? ` + ${s.taxRate}% tax` : ""}.</p>
          </div>
        </div>

        {/* Behaviour */}
        <div className="adm-card">
          <div className="adm-card-head"><div><h3>Behaviour</h3><p>How checkout works for customers</p></div></div>
          <div className="adm-card-body">
            <div className="adm-switchrow">
              <div className="adm-switchrow-info"><strong>Guest checkout</strong><span>Allow purchase without an account</span></div>
              <Toggle checked={s.guestCheckout} onChange={(v) => patch({ guestCheckout: v })} />
            </div>
            <div className="adm-switchrow">
              <div className="adm-switchrow-info"><strong>Require phone number</strong><span>For delivery updates</span></div>
              <Toggle checked={s.requirePhone} onChange={(v) => patch({ requirePhone: v })} />
            </div>
            <div className="adm-switchrow">
              <div className="adm-switchrow-info"><strong>Order notes</strong><span>Let customers add a note to their order</span></div>
              <Toggle checked={s.orderNotes} onChange={(v) => patch({ orderNotes: v })} />
            </div>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="adm-card" style={{ marginTop: 16 }}>
        <div className="adm-card-head"><div><h3>Payment methods</h3><p>{s.payments.filter((p) => p.enabled).length} of {s.payments.length} enabled</p></div></div>
        <div className="adm-card-body">
          {s.payments.map((p) => (
            <div key={p.key} className="adm-switchrow">
              <div className="adm-switchrow-info"><strong>{p.label}</strong><span>{p.key}</span></div>
              <Toggle checked={p.enabled} onChange={(v) => togglePayment(p.key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Checkout fields */}
      <div className="adm-card" style={{ marginTop: 16 }}>
        <div className="adm-card-head"><div><h3>Checkout fields</h3><p>Shown on the shipping form</p></div></div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Field</th><th>Key</th><th>Required</th><th style={{ textAlign: "right" }}>Shown</th></tr></thead>
            <tbody>
              {s.fields.map((f) => (
                <tr key={f.key}>
                  <td className="adm-cell-main">{f.label}</td>
                  <td className="adm-cell-sub">{f.key}</td>
                  <td>
                    <Toggle checked={f.required} onChange={(v) => patchField(f.key, { required: v })} />
                  </td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Toggle checked={f.enabled} onChange={(v) => patchField(f.key, { enabled: v })} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Toast msg={toast} />
    </>
  );
}
