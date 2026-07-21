"use client";

import { useState } from "react";
import { ADMIN_GIFT_CARDS, type AdminGiftCard } from "@/lib/admin-data";
import { GiftCardBadge, Toast, useToast, money } from "@/components/admin/ui";

function randomCode() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GIFT-${part()}-${part()}`;
}
function isoDays(d: number) {
  return new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
}

export default function GiftCardsAdmin() {
  const [cards, setCards] = useState<AdminGiftCard[]>(ADMIN_GIFT_CARDS);
  const [issuing, setIssuing] = useState(false);
  const [toast, showToast] = useToast();

  const outstanding = cards.filter((c) => c.status === "active").reduce((s, c) => s + c.currentBalance, 0);
  const issued = cards.reduce((s, c) => s + c.initialBalance, 0);

  function disable(id: string) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: c.status === "disabled" ? "active" : "disabled" } : c)));
  }
  function issue(amount: number, email: string) {
    const card: AdminGiftCard = {
      id: `gc_${Date.now().toString(36)}`, code: randomCode(), initialBalance: amount, currentBalance: amount,
      status: "active", issuedTo: email, expiresAt: isoDays(365), createdAt: isoDays(0),
    };
    setCards((prev) => [card, ...prev]);
    setIssuing(false);
    showToast(`Issued ${money(amount)} gift card`);
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Gift Cards</h2>
          <p>Issue and track store credit.</p>
        </div>
        <div className="adm-head-actions">
          <button className="adm-btn adm-btn-primary" onClick={() => setIssuing(true)}>+ Issue gift card</button>
        </div>
      </div>

      <div className="adm-stats">
        <div className="adm-stat"><div className="adm-stat-label">Cards issued</div><div className="adm-stat-value">{cards.length}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Total value issued</div><div className="adm-stat-value">{money(issued)}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Outstanding balance</div><div className="adm-stat-value">{money(outstanding)}</div></div>
      </div>

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Code</th><th>Issued to</th><th>Balance</th><th>Status</th><th>Expires</th><th style={{ textAlign: "right" }}>Actions</th></tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id}>
                  <td><span className="adm-cell-main" style={{ fontFamily: "ui-monospace, monospace" }}>{c.code}</span></td>
                  <td>{c.issuedTo}</td>
                  <td>
                    <div className="adm-cell-main">{money(c.currentBalance)}</div>
                    <div className="adm-cell-sub">of {money(c.initialBalance)}</div>
                  </td>
                  <td><GiftCardBadge status={c.status} /></td>
                  <td className="adm-cell-sub">{c.expiresAt}</td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button className="adm-btn adm-btn-sm" onClick={() => disable(c.id)}>{c.status === "disabled" ? "Enable" : "Disable"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {issuing && <IssueModal onClose={() => setIssuing(false)} onIssue={issue} />}
      <Toast msg={toast} />
    </>
  );
}

function IssueModal({ onClose, onIssue }: { onClose: () => void; onIssue: (amount: number, email: string) => void }) {
  const [amount, setAmount] = useState(50);
  const [email, setEmail] = useState("");
  return (
    <div className="adm-overlay adm-modal-center" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head"><h3>Issue gift card</h3><button className="adm-close" onClick={onClose}>✕</button></div>
        <div className="adm-modal-body">
          <div className="adm-field">
            <label>Amount</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {[25, 50, 100, 200].map((v) => (
                <button key={v} className={`adm-pill${amount === v ? " is-active" : ""}`} onClick={() => setAmount(v)}>{money(v)}</button>
              ))}
            </div>
            <input className="adm-input" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className="adm-field">
            <label>Recipient email</label>
            <input className="adm-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
        </div>
        <div className="adm-modal-foot">
          <button className="adm-btn" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn-primary" disabled={amount <= 0 || !email.trim()} onClick={() => onIssue(amount, email.trim())}>Issue card</button>
        </div>
      </div>
    </div>
  );
}
