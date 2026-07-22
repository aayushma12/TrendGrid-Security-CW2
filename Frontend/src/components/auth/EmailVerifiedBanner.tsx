"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/lib/api/auth";
import { formatAuthError, useAuth } from "@/lib/auth-context";

/** Soft nudge shown while the signed-in account's email is unverified — never blocks anything. */
export function EmailVerifiedBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.isEmailVerified) return null;

  async function onResend() {
    setError(null);
    setSending(true);
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="status"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", borderRadius: 10,
        padding: "12px 16px", fontSize: 14, marginBottom: 20,
      }}
    >
      <span>
        ✉️ Please verify your email address ({user.email}).
        {sent && " A new verification link is on its way."}
        {error && ` ${error}`}
      </span>
      <button
        type="button"
        onClick={onResend}
        disabled={sending || sent}
        style={{ background: "none", border: "none", color: "#1e40af", fontWeight: 700, cursor: "pointer", textDecoration: "underline", fontSize: 14 }}
      >
        {sending ? "Sending…" : sent ? "Sent" : "Resend email"}
      </button>
    </div>
  );
}
