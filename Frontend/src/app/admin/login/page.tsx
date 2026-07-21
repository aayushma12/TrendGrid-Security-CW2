"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatAuthError, useAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@trendgrid.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
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
          Sign in with your admin account to manage categories and catalog data.
        </p>

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

          {error && <div className="adm-login-error" role="alert">{error}</div>}

          <button className="adm-btn adm-btn-primary adm-login-submit" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="adm-login-hint">
          API: {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1"}
        </p>
      </div>
    </div>
  );
}
