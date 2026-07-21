"use client";

import { useAuth } from "@/lib/auth-context";

/** Soft nudge shown once per session when the API flags PASSWORD_MAX_AGE_DAYS exceeded — never blocks anything. */
export function PasswordExpiredBanner({ onChangePassword }: { onChangePassword: () => void }) {
  const { passwordExpired, dismissPasswordExpired } = useAuth();
  if (!passwordExpired) return null;

  return (
    <div
      role="status"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 10,
        padding: "12px 16px", fontSize: 14, marginBottom: 20,
      }}
    >
      <span>⚠️ Your password is over 90 days old. Consider changing it to keep your account secure.</span>
      <span style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        <button
          type="button"
          onClick={onChangePassword}
          style={{ background: "none", border: "none", color: "#92400e", fontWeight: 700, cursor: "pointer", textDecoration: "underline", fontSize: 14 }}
        >
          Change password
        </button>
        <button
          type="button"
          onClick={dismissPasswordExpired}
          aria-label="Dismiss"
          style={{ background: "none", border: "none", color: "#92400e", cursor: "pointer", fontSize: 14 }}
        >
          ✕
        </button>
      </span>
    </div>
  );
}
