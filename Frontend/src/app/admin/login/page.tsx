"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatAuthError, getAuthErrorCode, useAuth } from "@/lib/auth-context";
import { isMfaChallenge } from "@/lib/api/types";
import { resendMfaLoginOtp } from "@/lib/api/auth";
import { CaptchaWidget } from "@/components/auth/CaptchaWidget";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, completeMfaLogin } = useAuth();
  const [email, setEmail] = useState("admin@trendgrid.com");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaMethod, setMfaMethod] = useState<"totp" | "email" | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorCode(undefined);
    setSubmitting(true);
    try {
      const result = await login({ email, password, captchaToken });
      if (isMfaChallenge(result)) {
        setMfaToken(result.mfaToken);
        setMfaMethod(result.mfaMethod);
        return;
      }
      router.replace("/admin/categories");
    } catch (err) {
      setError(formatAuthError(err));
      setErrorCode(getAuthErrorCode(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (!mfaToken) return;
    setResendStatus("sending");
    try {
      await resendMfaLoginOtp(mfaToken);
      setResendStatus("sent");
    } catch (err) {
      setError(formatAuthError(err));
      setResendStatus("idle");
    }
  }

  async function onSubmitMfa(e: FormEvent) {
    e.preventDefault();
    if (!mfaToken) return;
    setError(null);
    setSubmitting(true);
    try {
      await completeMfaLogin(mfaToken, mfaCode);
      router.replace("/admin/categories");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="adm-login-wrap">
      <div className="adm-login-card">
        <div className="adm-login-brand">
          <span className="adm-brand-dot">◆</span>
          <div>
            <strong>TrendGrid</strong>
            <span>Admin sign in</span>
          </div>
        </div>

        <p className="adm-login-sub">
          {mfaToken
            ? mfaMethod === "email"
              ? "Enter the 6-digit code we emailed you."
              : "Enter the 6-digit code from your authenticator app."
            : "Sign in with your admin account to manage categories and catalog data."}
        </p>

        {mfaToken ? (
          <form className="adm-login-form" onSubmit={onSubmitMfa}>
            <div className="adm-field">
              <label htmlFor="admin-mfa-code">Verification code</label>
              <input
                id="admin-mfa-code"
                className="adm-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                maxLength={16}
              />
              {mfaMethod === "email" && (
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                  Didn&apos;t get it?{" "}
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={resendStatus === "sending"}
                    style={{ color: "inherit", textDecoration: "underline", background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
                  >
                    {resendStatus === "sending" ? "Sending…" : resendStatus === "sent" ? "Sent — check your inbox" : "Resend code"}
                  </button>
                </p>
              )}
            </div>

            {error && <div className="adm-login-error" role="alert">{error}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="adm-btn"
                type="button"
                onClick={() => {
                  setMfaToken(null);
                  setMfaMethod(null);
                  setMfaCode("");
                  setResendStatus("idle");
                  setError(null);
                }}
              >
                Back
              </button>
              <button className="adm-btn adm-btn-primary adm-login-submit" type="submit" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? "Verifying…" : "Verify"}
              </button>
            </div>
          </form>
        ) : (
          <form className="adm-login-form" onSubmit={onSubmit}>
            <div className="adm-field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                className="adm-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@trendgrid.com"
              />
            </div>

            <div className="adm-field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                className="adm-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <CaptchaWidget onToken={setCaptchaToken} />

            {error && (
              <div className="adm-login-error" role="alert">
                {errorCode === "ACCOUNT_LOCKED" ? "🔒 " : ""}{error}
              </div>
            )}

            <button className="adm-btn adm-btn-primary adm-login-submit" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        <p className="adm-login-hint">
          API: {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1"}
        </p>
      </div>
    </div>
  );
}
