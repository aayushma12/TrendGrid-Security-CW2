"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { resendVerificationEmail, verifyEmail } from "@/lib/api/auth";
import { formatAuthError, useAuth } from "@/lib/auth-context";

type VerifyState = "checking" | "success" | "invalid";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { isAuthenticated, refreshUser } = useAuth();

  const [state, setState] = useState<VerifyState>(token ? "checking" : "invalid");
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  // Guards against React Strict Mode's dev-only double-invoke of this
  // effect. Unlike a `let cancelled` local (which only stops a stale
  // response from updating state), this stops the *second* call from ever
  // firing — the verification token is single-use, so a real second network
  // call would get "already used" back from the server and could easily be
  // the one that resolves last, showing a false failure even though the
  // first call already succeeded. Refs survive Strict Mode's mount →
  // cleanup → remount cycle, so this only fires once per token per mount.
  const requestedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    if (requestedTokenRef.current === token) return;
    requestedTokenRef.current = token;

    let cancelled = false;
    verifyEmail(token)
      .then(() => {
        if (cancelled) return;
        setState("success");
        // Picks up the fresh isEmailVerified flag if the user is already signed in.
        if (isAuthenticated) refreshUser();
      })
      .catch(() => {
        if (!cancelled) setState("invalid");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onResend() {
    setResendError(null);
    setResending(true);
    try {
      await resendVerificationEmail();
      setResent(true);
    } catch (err) {
      setResendError(formatAuthError(err));
    } finally {
      setResending(false);
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
            <span>Verify email</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">Verify your email</h1>
          </div>

          {state === "checking" && (
            <div role="status" aria-live="polite" className="nx-form-card">
              Verifying your email…
            </div>
          )}

          {state === "success" && (
            <div
              role="status"
              aria-live="polite"
              className="nx-form-card"
              style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>Your email has been verified.</p>
              <Link
                href={isAuthenticated ? "/profile" : "/login"}
                className="nx-btn nx-btn-dark"
                style={{ marginTop: 12, display: "inline-block" }}
              >
                {isAuthenticated ? "Go to your profile" : "Sign in"}
              </Link>
            </div>
          )}

          {state === "invalid" && (
            <div
              role="alert"
              className="nx-form-card"
              style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>This verification link is no longer valid.</p>
              <p style={{ margin: "6px 0 0", fontSize: 13.5 }}>
                It may have expired, already been used, or the link was incomplete.
                {isAuthenticated ? " Request a new one below." : " Sign in, then request a new one from your profile."}
              </p>

              {isAuthenticated && !resent && (
                <button
                  type="button"
                  className="nx-btn nx-btn-dark"
                  onClick={onResend}
                  disabled={resending}
                  style={{ marginTop: 12 }}
                >
                  {resending ? "Sending…" : "Resend verification email"}
                </button>
              )}
              {resent && (
                <p style={{ margin: "12px 0 0", fontSize: 13.5, fontWeight: 600 }}>
                  A new verification email is on its way.
                </p>
              )}
              {resendError && (
                <p role="alert" style={{ margin: "8px 0 0", fontSize: 13 }}>
                  {resendError}
                </p>
              )}

              {!isAuthenticated && (
                <Link href="/login" className="nx-btn nx-btn-dark" style={{ marginTop: 12, display: "inline-block" }}>
                  Sign in
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
