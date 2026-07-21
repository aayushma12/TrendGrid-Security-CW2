"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { forgotPassword } from "@/lib/api/auth";
import { formatAuthError } from "@/lib/auth-context";
import { CaptchaWidget } from "@/components/auth/CaptchaWidget";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email, captchaToken);
      // The API always responds the same way whether or not the email is
      // registered, so there's nothing more specific to show here either.
      setSent(true);
    } catch (err) {
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
            <Link href="/login">Sign in</Link>
            <span aria-hidden>/</span>
            <span>Forgot password</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">Forgot your password?</h1>
            <p style={{ color: "var(--nx-muted, #6b7280)", marginTop: 4 }}>
              Enter the email on your account and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {sent ? (
            <div
              role="status"
              aria-live="polite"
              className="nx-form-card"
              style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
            >
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              The link expires in 30 minutes and can only be used once.
            </div>
          ) : (
            <form className="nx-form-card" onSubmit={onSubmit}>
              <div className="nx-field is-full">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
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
                <CaptchaWidget onToken={setCaptchaToken} />
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
                  {submitting ? "Sending…" : "Send reset link"}
                </button>
              </div>
            </form>
          )}

          <p style={{ marginTop: 16, fontSize: 13, color: "var(--nx-muted, #6b7280)" }}>
            Remembered it? <Link href="/login">Back to sign in</Link>
          </p>
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
