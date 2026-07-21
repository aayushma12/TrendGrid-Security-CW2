"use client";

import { FormEvent, useState } from "react";
import QRCode from "qrcode";
import { confirmMfaEmailSetup, confirmMfaSetup, disableMfa, setupMfa, setupMfaEmail } from "@/lib/api/auth";
import { formatAuthError, useAuth } from "@/lib/auth-context";

const card: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "20px 22px",
  background: "#fff",
};
const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 };
const input: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  padding: "9px 16px", borderRadius: 8, border: "none", background: "#101828", color: "#fff",
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "9px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff",
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const errorBox: React.CSSProperties = {
  background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 13,
};
const okBox: React.CSSProperties = {
  background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 13,
};

type Step = "idle" | "choose" | "enrolling" | "enrollingEmail" | "backupCodes" | "disabling";

/** Self-contained 2FA (TOTP or email) enrollment/disable widget — used on /profile and /admin/settings. */
export function MfaEnrollmentCard() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>("idle");
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const enabled = Boolean(user?.mfaEnabled);

  async function startEnrollTotp() {
    setError(null);
    setBusy(true);
    try {
      const result = await setupMfa();
      setSecret(result.secret);
      const dataUrl = await QRCode.toDataURL(result.otpauthUrl, { width: 200, margin: 1 });
      setQrDataUrl(dataUrl);
      setStep("enrolling");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function startEnrollEmail() {
    setError(null);
    setBusy(true);
    try {
      await setupMfaEmail();
      setStep("enrollingEmail");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = step === "enrollingEmail" ? await confirmMfaEmailSetup(code) : await confirmMfaSetup(code);
      setBackupCodes(result.backupCodes);
      setStep("backupCodes");
      await refreshUser();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  function finishEnroll() {
    setStep("idle");
    setSecret("");
    setQrDataUrl(null);
    setCode("");
    setBackupCodes([]);
  }

  async function submitDisable(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await disableMfa(currentPassword);
      setCurrentPassword("");
      setStep("idle");
      await refreshUser();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  if (step === "backupCodes") {
    return (
      <div style={card}>
        <h3 style={{ margin: "0 0 6px" }}>Save your backup codes</h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
          Two-factor authentication is now enabled. Each code below can be used once if you lose access
          to your authenticator app — store them somewhere safe. They won&apos;t be shown again.
        </p>
        <div
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontFamily: "monospace",
            fontSize: 14, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, marginBottom: 14,
          }}
        >
          {backupCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <button type="button" style={btnPrimary} onClick={finishEnroll}>
          Done
        </button>
      </div>
    );
  }

  if (step === "choose") {
    return (
      <div style={card}>
        <h3 style={{ margin: "0 0 6px" }}>Set up two-factor authentication</h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
          Choose how you&apos;d like to receive your sign-in codes.
        </p>
        {error && <div style={{ ...errorBox, marginBottom: 12 }} role="alert">{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" style={btnPrimary} onClick={startEnrollTotp} disabled={busy}>
            {busy ? "Starting…" : "Use an authenticator app"}
          </button>
          <button type="button" style={btnGhost} onClick={startEnrollEmail} disabled={busy}>
            {busy ? "Starting…" : "Email me a code at every sign-in"}
          </button>
          <button type="button" style={{ ...btnGhost, border: "none", color: "#6b7280" }} onClick={() => setStep("idle")}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === "enrollingEmail") {
    return (
      <div style={card}>
        <h3 style={{ margin: "0 0 6px" }}>Check your email</h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
          We sent a 6-digit verification code to <strong>{user?.email}</strong>. Enter it below to turn on
          email-based two-factor authentication.
        </p>
        <form onSubmit={confirmEnroll}>
          <label style={label} htmlFor="mfa-email-confirm-code">Verification code</label>
          <input
            id="mfa-email-confirm-code"
            style={{ ...input, maxWidth: 160, marginBottom: 12 }}
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
          {error && <div style={{ ...errorBox, marginBottom: 12 }} role="alert">{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={btnGhost} onClick={finishEnroll}>Cancel</button>
            <button type="submit" style={btnPrimary} disabled={busy}>{busy ? "Confirming…" : "Confirm & enable"}</button>
            <button
              type="button"
              style={{ ...btnGhost, border: "none", color: "#6b7280" }}
              onClick={startEnrollEmail}
              disabled={busy}
            >
              Resend code
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === "enrolling") {
    return (
      <div style={card}>
        <h3 style={{ margin: "0 0 6px" }}>Set up two-factor authentication</h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
          Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password, etc.), or
          enter the code manually.
        </p>
        {qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="MFA QR code" width={180} height={180} style={{ marginBottom: 12 }} />
        )}
        <div style={{ marginBottom: 14 }}>
          <span style={label}>Manual entry code</span>
          <code style={{ fontSize: 13, background: "#f3f4f6", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>
            {secret}
          </code>
        </div>
        <form onSubmit={confirmEnroll}>
          <label style={label} htmlFor="mfa-confirm-code">Enter the 6-digit code to confirm</label>
          <input
            id="mfa-confirm-code"
            style={{ ...input, maxWidth: 160, marginBottom: 12 }}
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
          {error && <div style={{ ...errorBox, marginBottom: 12 }} role="alert">{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={btnGhost} onClick={finishEnroll}>Cancel</button>
            <button type="submit" style={btnPrimary} disabled={busy}>{busy ? "Confirming…" : "Confirm & enable"}</button>
          </div>
        </form>
      </div>
    );
  }

  if (step === "disabling") {
    return (
      <div style={card}>
        <h3 style={{ margin: "0 0 6px" }}>Disable two-factor authentication</h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
          Confirm your current password to turn off 2FA for this account.
        </p>
        <form onSubmit={submitDisable}>
          <label style={label} htmlFor="mfa-disable-password">Current password</label>
          <input
            id="mfa-disable-password"
            style={{ ...input, marginBottom: 12 }}
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          {error && <div style={{ ...errorBox, marginBottom: 12 }} role="alert">{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={btnGhost} onClick={() => { setStep("idle"); setError(null); }}>Cancel</button>
            <button type="submit" style={{ ...btnPrimary, background: "#b91c1c" }} disabled={busy}>
              {busy ? "Disabling…" : "Disable 2FA"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={card}>
      <h3 style={{ margin: "0 0 6px" }}>Two-factor authentication</h3>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
        {enabled
          ? user?.mfaMethod === "email"
            ? "Enabled — a code emailed to you is required at every sign-in."
            : "Enabled — a code from your authenticator app is required at every sign-in."
          : "Add an extra layer of security: a code is required at every sign-in, from an authenticator app or your email."}
      </p>
      {error && <div style={{ ...errorBox, marginBottom: 12 }} role="alert">{error}</div>}
      {enabled ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ ...okBox, display: "inline-flex", alignItems: "center", gap: 6 }}>● Enabled</span>
          <button type="button" style={btnGhost} onClick={() => setStep("disabling")}>Disable</button>
        </div>
      ) : (
        <button type="button" style={btnPrimary} onClick={() => setStep("choose")} disabled={busy}>
          Enable 2FA
        </button>
      )}
    </div>
  );
}
