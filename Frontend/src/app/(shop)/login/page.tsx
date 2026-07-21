"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { formatAuthError, getAuthErrorCode, useAuth } from "@/lib/auth-context";
import { isStaffRole } from "@/lib/roles";
import { isMfaChallenge } from "@/lib/api/types";
import type { AuthUser } from "@/lib/api/types";
import { resendMfaLoginOtp } from "@/lib/api/auth";
import { CaptchaWidget } from "@/components/auth/CaptchaWidget";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, completeMfaLogin, user, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  // Set once /auth/login reports this account has MFA enrolled — switches
  // the form to the "enter your 6-digit code" step instead of signing in.
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaMethod, setMfaMethod] = useState<"totp" | "email" | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  // A staff account (ADMIN/EDITOR) has no business landing in the customer
  // area — send it to the admin console instead of wherever the customer
  // flow was headed. See CustomerAreaGuard for the same rule enforced on
  // every navigation, not just right after login.
  function redirectAfterLogin(loggedInUser: AuthUser) {
    if (isStaffRole(loggedInUser.role)) {
      router.replace("/admin");
      return;
    }
    router.replace(params.get("redirect") || "/orders");
  }

  // Already signed in? Don't make them look at a login form — send them
  // straight to where they were headed (checkout, orders, etc.).
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      redirectAfterLogin(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated, user, params, router]);

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
      redirectAfterLogin(result.user);
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
    setErrorCode(undefined);
    setSubmitting(true);
    try {
      const loggedInUser = await completeMfaLogin(mfaToken, mfaCode);
      redirectAfterLogin(loggedInUser);
    } catch (err) {
      setError(formatAuthError(err));
      setErrorCode(getAuthErrorCode(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container" style={{ maxWidth: 440 }}>
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>Sign in</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">Sign in</h1>
            <p style={{ color: "var(--nx-muted, #6b7280)", marginTop: 4 }}>
              {mfaToken
                ? mfaMethod === "email"
                  ? "Enter the 6-digit code we emailed you."
                  : "Enter the 6-digit code from your authenticator app."
                : "Sign in to view your orders and track deliveries."}
            </p>
          </div>

          {mfaToken ? (
            <form className="nx-form-card" onSubmit={onSubmitMfa}>
              <div className="nx-field is-full">
                <label htmlFor="mfa-code">Verification code</label>
                <input
                  id="mfa-code"
                  className="nx-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="123456"
                  maxLength={16}
                />
                {mfaMethod === "email" ? (
                  <p style={{ fontSize: 12, color: "var(--nx-muted, #6b7280)", marginTop: 6 }}>
                    Didn&apos;t get it?{" "}
                    <button
                      type="button"
                      onClick={onResend}
                      disabled={resendStatus === "sending"}
                      style={{ color: "inherit", textDecoration: "underline", background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
                    >
                      {resendStatus === "sending" ? "Sending…" : resendStatus === "sent" ? "Sent — check your inbox" : "Resend code"}
                    </button>{" "}
                    or use one of your backup codes instead.
                  </p>
                ) : (
                  <p style={{ fontSize: 12, color: "var(--nx-muted, #6b7280)", marginTop: 6 }}>
                    Lost access to your app? You can use one of your backup codes instead.
                  </p>
                )}
              </div>

              {error && (
                <div role="alert" style={{ gridColumn: "1 / -1", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 14 }}>
                  {error}
                </div>
              )}

              <div className="nx-field is-full" style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="nx-btn"
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
                <button type="submit" className="nx-btn nx-btn-dark" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? "Verifying…" : "Verify"}
                </button>
              </div>
            </form>
          ) : (
            <form className="nx-form-card" onSubmit={onSubmit}>
              <div className="nx-field is-full">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  className="nx-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="nx-field is-full">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label htmlFor="login-password">Password</label>
                  <Link href="/forgot-password" style={{ fontSize: 13, color: "var(--nx-muted, #6b7280)" }}>
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="login-password"
                  className="nx-input"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="nx-field is-full">
                <CaptchaWidget onToken={setCaptchaToken} />
              </div>

              {error && (
                <div
                  role="alert"
                  style={{
                    gridColumn: "1 / -1", background: "#fef2f2", color: "#b91c1c",
                    border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 14,
                  }}
                >
                  {errorCode === "ACCOUNT_LOCKED" ? "🔒 " : ""}{error}
                </div>
              )}

              <div className="nx-field is-full">
                <button type="submit" className="nx-btn nx-btn-dark" disabled={submitting} style={{ width: "100%" }}>
                  {submitting ? "Signing in…" : "Sign in"}
                </button>
              </div>
            </form>
          )}

          <p style={{ marginTop: 16, fontSize: 13, color: "var(--nx-muted, #6b7280)" }}>
            Don&apos;t have an account? <Link href={`/register${params.get("redirect") ? `?redirect=${encodeURIComponent(params.get("redirect")!)}` : ""}`}>Create one</Link>
          </p>
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}

export default function ShopLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
