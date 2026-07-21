"use client";

import { FormEvent, useState } from "react";
import { changePassword } from "@/lib/api/auth";
import { formatAuthError, useAuth } from "@/lib/auth-context";
import { PasswordStrengthMeter, passwordMeetsPolicy } from "./PasswordStrengthMeter";

const card: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px", background: "#fff" };
const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 };
const input: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  padding: "9px 16px", borderRadius: 8, border: "none", background: "#101828", color: "#fff",
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const errorBox: React.CSSProperties = { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 13 };
const okBox: React.CSSProperties = { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 13 };

/** Self-contained change-password widget — used on /profile and /admin/settings. */
export function ChangePasswordForm() {
  const { dismissPasswordExpired } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    if (!passwordMeetsPolicy(newPassword)) {
      setError("Password must be at least 8 characters and include upper/lowercase letters, a number, and a special character.");
      return;
    }
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      dismissPasswordExpired();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={card}>
      <h3 style={{ margin: "0 0 6px" }}>Change password</h3>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
        Changing your password signs out every other active session on this account.
      </p>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={label} htmlFor="cp-current">Current password</label>
          <input id="cp-current" style={input} type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={label} htmlFor="cp-new">New password</label>
          <input id="cp-new" style={input} type="password" autoComplete="new-password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <PasswordStrengthMeter password={newPassword} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={label} htmlFor="cp-confirm">Confirm new password</label>
          <input id="cp-confirm" style={input} type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        {error && <div style={{ ...errorBox, marginBottom: 12 }} role="alert">{error}</div>}
        {success && <div style={{ ...okBox, marginBottom: 12 }} role="status">Password changed successfully.</div>}
        <button type="submit" style={btnPrimary} disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
      </form>
    </div>
  );
}
