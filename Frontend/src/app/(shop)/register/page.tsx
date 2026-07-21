"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { formatAuthError, useAuth } from "@/lib/auth-context";

/**
 * /register — customer self-registration. Backend always assigns role USER
 * and auto-signs the account in on success, so this mirrors the login page's
 * redirect behaviour once `register()` resolves.
 */
function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { register, isAuthenticated, loading } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Skip the signup form and send them on their way.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(params.get("redirect") || "/profile");
    }
  }, [loading, isAuthenticated, params, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError("Password must be at least 8 characters and include an uppercase letter and a number.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber.trim() || undefined,
        password,
      });
      router.replace(params.get("redirect") || "/profile");
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
        <div className="nx-container" style={{ maxWidth: 480 }}>
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>Create account</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">Create your account</h1>
            <p style={{ color: "var(--nx-muted, #6b7280)", marginTop: 4 }}>
              Join to save your wishlist, track orders and check out faster.
            </p>
          </div>

          <form className="nx-form-card" onSubmit={onSubmit}>
            <div className="nx-field">
              <label htmlFor="reg-first">First name</label>
              <input
                id="reg-first"
                className="nx-input"
                type="text"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Aayushma"
              />
            </div>
            <div className="nx-field">
              <label htmlFor="reg-last">Last name</label>
              <input
                id="reg-last"
                className="nx-input"
                type="text"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Acharya"
              />
            </div>
            <div className="nx-field is-full">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-phone">Phone (optional)</label>
              <input
                id="reg-phone"
                className="nx-input"
                type="tel"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="98XXXXXXXX"
              />
            </div>
            <div className="nx-field">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                className="nx-input"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="nx-field">
              <label htmlFor="reg-confirm">Confirm password</label>
              <input
                id="reg-confirm"
                className="nx-input"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <p className="nx-field is-full" style={{ margin: 0, fontSize: 12, color: "var(--nx-muted, #6b7280)" }}>
              At least 8 characters, with one uppercase letter and one number.
            </p>

            {error && (
              <div
                role="alert"
                style={{
                  gridColumn: "1 / -1", background: "#fef2f2", color: "#b91c1c",
                  border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <div className="nx-field is-full">
              <button type="submit" className="nx-btn nx-btn-dark" disabled={submitting} style={{ width: "100%" }}>
                {submitting ? "Creating account…" : "Create account"}
              </button>
            </div>
          </form>

          <p style={{ marginTop: 16, fontSize: 13, color: "var(--nx-muted, #6b7280)" }}>
            Already have an account? <Link href={`/login${params.get("redirect") ? `?redirect=${encodeURIComponent(params.get("redirect")!)}` : ""}`}>Sign in</Link>
          </p>
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
