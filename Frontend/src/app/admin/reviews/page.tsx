"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveReview,
  deleteReview,
  getReviewAnalytics,
  hideReview,
  listReviews,
  rejectReview,
  replyToReview,
  restoreReview,
} from "@/lib/api/reviews";
import type { ReviewAnalytics } from "@/lib/api/reviews";
import { listAllProducts } from "@/lib/api/products";
import { listUsers } from "@/lib/api/users";
import { formatAuthError } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import type { ReviewDto, ReviewStatus } from "@/lib/api/types";
import { Badge, Toast, useConfirmDialog, useToast } from "@/components/admin/ui";

const FILTERS: Array<ReviewStatus | "all"> = ["all", "PENDING", "APPROVED", "REJECTED", "HIDDEN"];
const STATUS_TONE: Record<ReviewStatus, string> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  HIDDEN: "gray",
  DELETED: "slate",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: "#f59e0b", letterSpacing: 1 }} aria-label={`${n} stars`}>
      {"★".repeat(n)}<span style={{ color: "#d0d5dd" }}>{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [toast, showToast] = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewRes, allProducts, userRes] = await Promise.all([
        listReviews({ limit: 100 }),
        listAllProducts(),
        listUsers({ limit: 100 }),
      ]);
      setReviews(reviewRes.data);
      setProductNames(Object.fromEntries(allProducts.map((p) => [p.id, p.name])));
      setUserNames(Object.fromEntries(userRes.data.map((u) => [u.id, `${u.firstName} ${u.lastName}`])));
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await getReviewAnalytics();
      setAnalytics(res.data);
    } catch {
      // Non-fatal — the review list itself still works if analytics fails.
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: reviews.length };
    for (const s of ["PENDING", "APPROVED", "REJECTED", "HIDDEN"]) m[s] = reviews.filter((r) => r.status === s).length;
    return m;
  }, [reviews]);

  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);
  const approved = reviews.filter((r) => r.status === "APPROVED");
  const avgRating = approved.length ? (approved.reduce((s, r) => s + r.rating, 0) / approved.length).toFixed(1) : "—";

  function applyUpdated(updated: ReviewDto) {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    void loadAnalytics();
  }

  async function runAction(id: string, label: string, action: () => Promise<{ data: ReviewDto }>) {
    setBusyId(id);
    try {
      const res = await action();
      applyUpdated(res.data);
      showToast(label);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(r: ReviewDto) {
    if (
      !(await confirm({
        message: "Permanently delete this review? This cannot be undone.",
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    setBusyId(r.id);
    try {
      await deleteReview(r.id);
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
      showToast("Review deleted");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setBusyId(null);
    }
  }

  function startReply(r: ReviewDto) {
    setReplyingId(r.id);
    setReplyText(r.adminReply ?? "");
  }

  async function submitReply(id: string) {
    if (!replyText.trim()) return;
    setBusyId(id);
    try {
      const res = await replyToReview(id, replyText.trim());
      applyUpdated(res.data);
      showToast("Reply saved");
      setReplyingId(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Reviews</h2>
          <p>Loaded from the Trendgrid API. Moderate customer reviews before they appear on product pages.</p>
        </div>
        <div className="adm-head-actions">
          <button className="adm-btn" onClick={() => void load()} disabled={loading}>Refresh</button>
        </div>
      </div>

      <div className="adm-stats">
        <div className="adm-stat"><div className="adm-stat-label">Total reviews</div><div className="adm-stat-value">{analytics?.totalReviews ?? reviews.length}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Awaiting moderation</div><div className="adm-stat-value">{analytics?.pendingCount ?? counts.PENDING ?? 0}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Approved</div><div className="adm-stat-value">{analytics?.approvedCount ?? counts.APPROVED ?? 0}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Rejected</div><div className="adm-stat-value">{analytics?.rejectedCount ?? counts.REJECTED ?? 0}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Avg rating (approved)</div><div className="adm-stat-value">{analytics ? analytics.averageRating.toFixed(1) : avgRating}★</div></div>
      </div>

      {analytics && (analytics.topRated.length > 0 || analytics.lowestRated.length > 0) && (
        <div className="adm-grid-2" style={{ marginBottom: 16 }}>
          {analytics.topRated.length > 0 && (
            <div className="adm-card">
              <div className="adm-card-head"><div><h3>Top rated products</h3><p>Minimum 3 approved reviews</p></div></div>
              <div className="adm-card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {analytics.topRated.map((p) => (
                  <div key={p.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span>{p.productName}</span>
                    <span><Stars n={Math.round(p.averageRating)} /> {p.averageRating.toFixed(1)} ({p.reviewCount})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {analytics.lowestRated.length > 0 && (
            <div className="adm-card">
              <div className="adm-card-head"><div><h3>Lowest rated products</h3><p>Minimum 3 approved reviews — may need attention</p></div></div>
              <div className="adm-card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {analytics.lowestRated.map((p) => (
                  <div key={p.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span>{p.productName}</span>
                    <span><Stars n={Math.round(p.averageRating)} /> {p.averageRating.toFixed(1)} ({p.reviewCount})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="adm-pills">
        {FILTERS.map((f) => (
          <button key={f} className={`adm-pill${filter === f ? " is-active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f} <span className="adm-pill-count">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="adm-card">
          <div className="adm-empty">Loading reviews from API…</div>
        </div>
      )}

      {!loading && error && (
        <div className="adm-card">
          <div className="adm-login-error" style={{ margin: 16 }} role="alert">{error}</div>
          <div style={{ padding: "0 16px 16px" }}>
            <button className="adm-btn adm-btn-primary" onClick={() => void load()}>Retry</button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((r) => {
            const busy = busyId === r.id;
            return (
              <div key={r.id} className="adm-card">
                <div className="adm-card-body" style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                      <Stars n={r.rating} />
                      {r.title && <strong>{r.title}</strong>}
                      <Badge tone={STATUS_TONE[r.status]}>{r.status.toLowerCase()}</Badge>
                      {r.orderId && <Badge tone="blue">verified purchase</Badge>}
                    </div>
                    {r.comment && <p style={{ margin: "0 0 8px", fontSize: 14, color: "#344054" }}>{r.comment}</p>}
                    <div className="adm-cell-sub">
                      {userNames[r.userId] ?? "Unknown customer"} · on <strong>{productNames[r.productId] ?? "Unknown product"}</strong> · {fmtDate(r.createdAt)}
                    </div>
                    {r.images.length > 0 && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        {r.images.map((img) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={img.id} src={img.imageUrl} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} />
                        ))}
                      </div>
                    )}
                    {r.adminReply && replyingId !== r.id && (
                      <div className="adm-card" style={{ marginTop: 10, padding: 10, background: "#f9fafb" }}>
                        <div className="adm-cell-sub" style={{ marginBottom: 4 }}>Store reply{r.adminRepliedAt ? ` · ${fmtDate(r.adminRepliedAt)}` : ""}</div>
                        <div style={{ fontSize: 14 }}>{r.adminReply}</div>
                      </div>
                    )}
                    {replyingId === r.id && (
                      <div style={{ marginTop: 10 }}>
                        <textarea
                          className="adm-textarea"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a public reply…"
                          rows={3}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          <button className="adm-btn adm-btn-sm adm-btn-primary" disabled={!replyText.trim() || busy} onClick={() => void submitReply(r.id)}>
                            {busy ? "Saving…" : "Save reply"}
                          </button>
                          <button className="adm-btn adm-btn-sm" onClick={() => setReplyingId(null)} disabled={busy}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {r.status !== "APPROVED" && (
                      <button className="adm-btn adm-btn-sm adm-btn-primary" disabled={busy} onClick={() => void runAction(r.id, "Review approved", () => approveReview(r.id))}>
                        Approve
                      </button>
                    )}
                    {r.status !== "REJECTED" && (
                      <button className="adm-btn adm-btn-sm adm-btn-danger" disabled={busy} onClick={() => void runAction(r.id, "Review rejected", () => rejectReview(r.id))}>
                        Reject
                      </button>
                    )}
                    {r.status === "APPROVED" && (
                      <button className="adm-btn adm-btn-sm" disabled={busy} onClick={() => void runAction(r.id, "Review hidden", () => hideReview(r.id))}>
                        Hide
                      </button>
                    )}
                    {(r.status === "REJECTED" || r.status === "HIDDEN") && (
                      <button className="adm-btn adm-btn-sm" disabled={busy} onClick={() => void runAction(r.id, "Review restored", () => restoreReview(r.id))}>
                        Restore
                      </button>
                    )}
                    {replyingId !== r.id && (
                      <button className="adm-btn adm-btn-sm" disabled={busy} onClick={() => startReply(r)}>
                        {r.adminReply ? "Edit reply" : "Reply"}
                      </button>
                    )}
                    <button className="adm-btn adm-btn-sm adm-btn-danger" disabled={busy} onClick={() => void remove(r)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="adm-card"><div className="adm-empty">No reviews in this filter.</div></div>}
        </div>
      )}

      <Toast msg={toast} />
      {dialog}
    </>
  );
}
