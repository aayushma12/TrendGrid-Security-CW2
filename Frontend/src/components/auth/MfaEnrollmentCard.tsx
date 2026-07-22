"use client";

import { FormEvent, useState } from "react";
import QRCode from "qrcode";
import { confirmMfaEmailSetup, confirmMfaSetup, disableMfa, setupMfa, setupMfaEmail } from "@/lib/api/auth";
import { formatAuthError, useAuth } from "@/lib/auth-context";

/**
 * Self-contained styling — deliberately NOT the storefront's `nx-*` classes
 * or the admin panel's `adm-*` classes. This component renders on both
 * /profile (loads home-nexa.css) and /admin/settings (loads admin.css,
 * a separate stylesheet with no nx-* classes at all), so it can't safely
 * depend on either route group's ambient CSS. Both themes share the same
 * literal token values (ink #131311, muted #6b6b66, border #e6e6e0,
 * bg #f7f7f4) — hardcoded here so it looks native in both places.
 */
const ink = "#131311";
const inkSoft = "#6b6b66";
const border = "#e6e6e0";
const bg = "#f7f7f4";
const surface = "#ffffff";
const radius = 14;

const card: React.CSSProperties = {
  border: `1px solid ${border}`, borderRadius: 16, padding: "22px 24px", background: surface,
};
const heading: React.CSSProperties = { margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: ink };
const subtext: React.CSSProperties = { fontSize: 13, color: inkSoft, margin: "0 0 16px", lineHeight: 1.5 };
const fieldLabel: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 };
const inputBase: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${border}`,
  fontSize: 14, boxSizing: "border-box", background: bg, color: ink, outline: "none",
};
const codeInput: React.CSSProperties = {
  ...inputBase, width: "auto", maxWidth: 220, fontSize: 22, letterSpacing: "0.4em",
  textAlign: "center", fontVariantNumeric: "tabular-nums",
};
const btnBase: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600,
  cursor: "pointer", transition: "opacity 0.15s ease",
};
const btnPrimary: React.CSSProperties = { ...btnBase, background: ink, color: "#fff" };
const btnGhost: React.CSSProperties = { ...btnBase, background: "transparent", border: `1.5px solid ${ink}`, color: ink };
const btnDanger: React.CSSProperties = { ...btnBase, background: "#b91c1c", color: "#fff" };
const errorBox: React.CSSProperties = {
  background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 14,
};
const statusPill = (active: boolean): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 600,
  background: active ? "#f0fdf4" : bg, color: active ? "#166534" : inkSoft, border: `1px solid ${active ? "#bbf7d0" : border}`,
});

type Step = "idle" | "choose" | "enrolling" | "enrollingEmail" | "backupCodes" | "disabling";
type Method = "totp" | "email";

/** Self-contained 2FA (TOTP or email) enrollment/disable widget — used on /profile and /admin/settings. */
export function MfaEnrollmentCard() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>("idle");
  const [chosenMethod, setChosenMethod] = useState<Method>("totp");
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
      const dataUrl = await QRCode.toDataURL(result.otpauthUrl, { width: 208, margin: 1 });
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

  async function continueFromChoice() {
    if (chosenMethod === "totp") await startEnrollTotp();
    else await startEnrollEmail();
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
        <h3 style={heading}>Save your backup codes</h3>
        <p style={subtext}>
          Two-factor authentication is now enabled. Each code below can be used once if you lose access
          to your authenticator app — store them somewhere safe. They won&apos;t be shown again.
        </p>
        <div
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontFamily: "monospace",
            fontSize: 14, background: bg, border: `1px solid ${border}`, borderRadius: radius, padding: 16, marginBottom: 18,
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
        <h3 style={heading}>Choose authentication method</h3>
        <p style={subtext}>Pick how you&apos;d like to receive your sign-in codes. You can change this later.</p>
        {error && <div style={{ ...errorBox, marginBottom: 14 }} role="alert">{error}</div>}
        <div role="radiogroup" aria-label="MFA method" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          {(
            [
              { value: "totp" as const, title: "Authenticator app", desc: "Google Authenticator, Authy, 1Password, Microsoft Authenticator, etc." },
              { value: "email" as const, title: "Email OTP", desc: `A 6-digit code sent to ${user?.email ?? "your email"} at every sign-in.` },
            ]
          ).map((opt) => (
            <label
              key={opt.value}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
                border: `1.5px solid ${chosenMethod === opt.value ? ink : border}`,
                borderRadius: radius, cursor: "pointer", background: surface,
              }}
            >
              <input
                type="radio"
                name="mfa-method"
                value={opt.value}
                checked={chosenMethod === opt.value}
                onChange={() => setChosenMethod(opt.value)}
                style={{ marginTop: 3 }}
              />
              <span>
                <span style={{ display: "block", fontWeight: 700, fontSize: 14, color: ink }}>{opt.title}</span>
                <span style={{ display: "block", fontSize: 12.5, color: inkSoft, marginTop: 2 }}>{opt.desc}</span>
              </span>
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" style={btnGhost} onClick={() => setStep("idle")}>
            Cancel
          </button>
          <button type="button" style={btnPrimary} onClick={continueFromChoice} disabled={busy}>
            {busy ? "Starting…" : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "enrollingEmail") {
    return (
      <div style={card}>
        <h3 style={heading}>Check your email</h3>
        <p style={subtext}>
          We sent a 6-digit verification code to <strong>{user?.email}</strong>. Enter it below to turn on
          email-based two-factor authentication.
        </p>
        <form onSubmit={confirmEnroll}>
          <label style={fieldLabel} htmlFor="mfa-email-confirm-code">Verification code</label>
          <input
            id="mfa-email-confirm-code"
            style={{ ...codeInput, marginBottom: 14 }}
            inputMode="numeric"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
          {error && <div style={{ ...errorBox, marginBottom: 14 }} role="alert">{error}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" style={btnGhost} onClick={finishEnroll}>Cancel</button>
            <button type="submit" style={btnPrimary} disabled={busy}>{busy ? "Confirming…" : "Confirm & enable"}</button>
            <button
              type="button"
              onClick={startEnrollEmail}
              disabled={busy}
              style={{ background: "none", border: "none", color: inkSoft, textDecoration: "underline", cursor: "pointer", fontSize: 13, padding: 0 }}
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
        <h3 style={heading}>Scan with your authenticator app</h3>
        <p style={subtext}>
          Open your authenticator app (Google Authenticator, Authy, 1Password, etc.) and scan this QR code,
          or enter the setup key manually.
        </p>
        {qrDataUrl && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{ padding: 12, background: "#fff", border: `1px solid ${border}`, borderRadius: radius }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Authenticator app QR code" width={188} height={188} />
            </div>
          </div>
        )}
        <div style={{ marginBottom: 18, textAlign: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: inkSoft, display: "block", marginBottom: 6 }}>
            Can&apos;t scan? Enter this setup key manually
          </span>
          <code style={{ fontSize: 13, background: bg, padding: "8px 12px", borderRadius: 8, display: "inline-block", letterSpacing: "0.05em" }}>
            {secret}
          </code>
        </div>
        <form onSubmit={confirmEnroll}>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <label style={{ ...fieldLabel, textAlign: "center" }} htmlFor="mfa-confirm-code">Enter the 6-digit code to confirm</label>
            <input
              id="mfa-confirm-code"
              style={codeInput}
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
            />
          </div>
          {error && <div style={{ ...errorBox, marginBottom: 14 }} role="alert">{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
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
        <h3 style={heading}>Disable two-factor authentication</h3>
        <p style={subtext}>Confirm your current password to turn off 2FA for this account.</p>
        <form onSubmit={submitDisable}>
          <label style={fieldLabel} htmlFor="mfa-disable-password">Current password</label>
          <input
            id="mfa-disable-password"
            style={{ ...inputBase, marginBottom: 14 }}
            type="password"
            required
            autoFocus
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
          {error && <div style={{ ...errorBox, marginBottom: 14 }} role="alert">{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={btnGhost} onClick={() => { setStep("idle"); setError(null); }}>Cancel</button>
            <button type="submit" style={btnDanger} disabled={busy}>
              {busy ? "Disabling…" : "Disable 2FA"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <h3 style={{ ...heading, margin: 0 }}>Two-factor authentication</h3>
        <span style={statusPill(enabled)}>● {enabled ? "Enabled" : "Disabled"}</span>
      </div>
      <p style={subtext}>
        {enabled
          ? user?.mfaMethod === "email"
            ? "A code emailed to you is required at every sign-in."
            : "A code from your authenticator app is required at every sign-in."
          : "Add an extra layer of security: a code is required at every sign-in, from an authenticator app or your email."}
      </p>
      {error && <div style={{ ...errorBox, marginBottom: 14 }} role="alert">{error}</div>}
      {enabled ? (
        <button type="button" style={btnGhost} onClick={() => setStep("disabling")}>
          Disable 2FA
        </button>
      ) : (
        <button type="button" style={btnPrimary} onClick={() => setStep("choose")} disabled={busy}>
          Enable two-factor authentication
        </button>
      )}
    </div>
  );
}
