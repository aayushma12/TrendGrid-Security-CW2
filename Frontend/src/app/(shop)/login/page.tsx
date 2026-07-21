"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { formatAuthError, useAuth } from "@/lib/auth-context";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Don't make them look at a login form — send them
  // straight to where they were headed (checkout, orders, etc.).
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(params.get("redirect") || "/orders");
    }
  }, [loading, isAuthenticated, params, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace(params.get("redirect") || "/orders");
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
            <span>Sign in</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">Sign in</h1>
            <p style={{ color: "var(--nx-muted, #6b7280)", marginTop: 4 }}>
              Sign in to view your orders and track deliveries.
            </p>
          </div>

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
              <label htmlFor="login-password">Password</label>
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
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>

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
