"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { trackOrder } from "@/lib/api/orders";
import { formatAuthError, useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import type { OrderDto } from "@/lib/api/types";
import { OrderEmptyState, OrderErrorState, TrackingCard } from "@/components/orders";

function TrackInner() {
  const params = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [identifier, setIdentifier] = useState(params.get("id") ?? "");
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runTrack(value: string) {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await trackOrder(value.trim());
      setOrder(res.data);
    } catch (err) {
      setOrder(null);
      setError(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runTrack(identifier);
  }

  // Auto-run if a ?id= was provided (e.g. linked from an order details page).
  useEffect(() => {
    const initial = params.get("id");
    if (initial && isAuthenticated) void runTrack(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container" style={{ maxWidth: 760 }}>
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>Track order</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">Track your order</h1>
            <p style={{ color: "var(--nx-muted, #6b7280)", marginTop: 4 }}>
              Enter your tracking number (TRK…) or order number (ORD-…) to see live delivery status.
            </p>
          </div>

          {authLoading ? null : !isAuthenticated ? (
            <OrderEmptyState
              title="Sign in to track your order"
              message="Order tracking is tied to your account so we can show accurate, private delivery details."
              action={
                <Link href="/login?redirect=/track" className="nx-btn nx-btn-dark">
                  Sign in
                </Link>
              }
            />
          ) : (
            <>
              <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
                <input
                  className="nx-input"
                  style={{ flex: 1, minWidth: 220 }}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="TRK928374923 or ORD-20260713-000001"
                  aria-label="Tracking or order number"
                />
                <button type="submit" className="nx-btn nx-btn-dark" disabled={loading || !identifier.trim()}>
                  {loading ? "Tracking…" : "Track"}
                </button>
              </form>

              {loading && <p style={{ color: "var(--nx-muted, #6b7280)" }}>Looking up your order…</p>}

              {!loading && error && <OrderErrorState message={error} onRetry={() => void runTrack(identifier)} />}

              {!loading && !error && order && <TrackingCard order={order} />}

              {!loading && !error && !order && searched && (
                <OrderEmptyState
                  title="Nothing found"
                  message="Double-check the tracking or order number and try again."
                />
              )}
            </>
          )}
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackInner />
    </Suspense>
  );
}
