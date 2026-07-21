"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { resetPassword, validateResetToken } from "@/lib/api/auth";
import { formatAuthError } from "@/lib/auth-context";
import { PasswordStrengthMeter, passwordMeetsPolicy } from "@/components/auth/PasswordStrengthMeter";

type TokenState = "checking" | "valid" | "invalid";

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [tokenState, setTokenState] = useState<TokenState>(token ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenState("invalid");
      return;
    }
    let cancelled = false;
    validateResetToken(token).then((valid) => {
      if (!cancelled) setTokenState(valid ? "valid" : "invalid");
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!passwordMeetsPolicy(password)) {
      setError("Password must be at least 8 characters and include upper/lowercase letters, a number, and a special character.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      // An expired/reused token can still surface here even after the
      // upfront check (e.g. it was used in another tab moments ago) — treat
      // it the same as the pre-check failing rather than a generic error.
      setError(formatAuthError(err));
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
            <span>Reset password</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">Reset your password</h1>
            <p style={{ color: "var(--nx-muted, #6b7280)", marginTop: 4 }}>
              Choose a new password for your account.
            </p>
          </div>

          {tokenState === "checking" && (
            <div role="status" aria-live="polite" className="nx-form-card">
              Checking your reset link…
            </div>
          )}

          {tokenState === "invalid" && (
            <div
              role="alert"
              className="nx-form-card"
              style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>This reset link is no longer valid.</p>
              <p style={{ margin: "6px 0 0", fontSize: 13.5 }}>
                It may have expired, already been used, or the link was incomplete. Request a new one below.
              </p>
              <Link href="/forgot-password" className="nx-btn nx-btn-dark" style={{ marginTop: 12, display: "inline-block" }}>
                Request a new reset link
              </Link>
            </div>
          )}

          {tokenState === "valid" && done && (
            <div
              role="status"
              aria-live="polite"
              className="nx-form-card"
              style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
            >
              Password reset successfully. You can now{" "}
              <Link href="/login" style={{ fontWeight: 600 }}>
                sign in
              </Link>{" "}
              with your new password.
            </div>
          )}

          {tokenState === "valid" && !done && (
            <form className="nx-form-card" onSubmit={onSubmit} noValidate>
              <div className="nx-field is-full">
                <label htmlFor="reset-password">New password</label>
                <input
                  id="reset-password"
                  className="nx-input"
                  type="password"
                  autoComplete="new-password"
                  required
                  aria-describedby="reset-password-rules"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <div id="reset-password-rules">
                  <PasswordStrengthMeter password={password} />
                </div>
              </div>
              <div className="nx-field is-full">
                <label htmlFor="reset-confirm">Confirm new password</label>
                <input
                  id="reset-confirm"
                  className="nx-input"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  style={{
                    gridColumn: "1 / -1", background: "#fef2f2", color: "#b91c1c",
                    border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 14,
                  }}
                >
                  {error}
                </div>
              )}

              <div className="nx-field is-full">
                <button type="submit" className="nx-btn nx-btn-dark" disabled={submitting} aria-busy={submitting} style={{ width: "100%" }}>
                  {submitting ? "Resetting…" : "Reset password"}
                </button>
              </div>
            </form>
          )}

          <p style={{ marginTop: 16, fontSize: 13, color: "var(--nx-muted, #6b7280)" }}>
            <Link href="/login">Back to sign in</Link>
          </p>
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
