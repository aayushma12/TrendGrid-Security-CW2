"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { listMyOrders } from "@/lib/api/orders";
import { formatAuthError, useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import type { OrderDto, OrderStatus } from "@/lib/api/types";
import {
  OrderCard, OrderEmptyState, OrderErrorState, OrderFilters, OrderListSkeleton, OrderTable, Pagination, SearchBar,
} from "@/components/orders";

const PAGE_SIZE = 8;

export default function OrderHistoryPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listMyOrders({
        page, limit: PAGE_SIZE,
        status: status === "all" ? undefined : status,
        search: search.trim() || undefined,
      });
      setOrders(res.data);
      setTotal(res.meta?.total ?? res.data.length);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  // Reset to page 1 whenever the filter/search changes (prevents landing on an empty page).
  useEffect(() => {
    setPage(1);
  }, [status, search]);

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container">
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>My Orders</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">My Orders</h1>
          </div>

          {authLoading ? (
            <OrderListSkeleton />
          ) : !isAuthenticated ? (
            <OrderEmptyState
              title="Sign in to view your orders"
              message="Your order history, tracking, and details are available once you're signed in."
              action={
                <Link href="/login?redirect=/orders" className="nx-btn nx-btn-dark">
                  Sign in
                </Link>
              }
            />
          ) : (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16, alignItems: "center", justifyContent: "space-between" }}>
                <OrderFilters value={status} onChange={setStatus} />
                <SearchBar value={search} onChange={setSearch} placeholder="Search by order number…" className="max-w-xs" />
              </div>

              {loading && <OrderListSkeleton />}

              {!loading && error && <OrderErrorState message={error} onRetry={() => void load()} />}

              {!loading && !error && orders.length === 0 && (
                <OrderEmptyState
                  title={search || status !== "all" ? "No matching orders" : "No orders yet"}
                  message={
                    search || status !== "all"
                      ? "Try a different search term or filter."
                      : "When you place an order, it will show up here."
                  }
                  action={
                    !search && status === "all" ? (
                      <Link href="/shop" className="nx-btn nx-btn-accent">
                        Start shopping
                      </Link>
                    ) : undefined
                  }
                />
              )}

              {!loading && !error && orders.length > 0 && (
                <>
                  <div className="hidden md:block">
                    <OrderTable orders={orders} onRowClick={(o) => (window.location.href = `/orders/${o.id}`)} />
                  </div>
                  <div className="grid gap-3 md:hidden">
                    {orders.map((o) => (
                      <OrderCard key={o.id} order={o} href={`/orders/${o.id}`} />
                    ))}
                  </div>

                  <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                    <span style={{ fontSize: 12, color: "var(--nx-muted, #6b7280)" }}>
                      {total} order{total === 1 ? "" : "s"} total
                    </span>
                  </div>
                </>
              )}

              {user && (
                <p style={{ marginTop: 24, fontSize: 12, color: "var(--nx-muted, #9ca3af)" }}>
                  Signed in as {user.email}
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
