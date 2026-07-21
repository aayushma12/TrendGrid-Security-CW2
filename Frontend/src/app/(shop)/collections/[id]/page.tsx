"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { NexaProductCard } from "@/components/home-nexa/NexaProductCard";
import { listCollectionProducts } from "@/lib/api/collections";
import { ApiError } from "@/lib/api/client";
import { formatAuthError } from "@/lib/auth-context";
import type { ProductDto } from "@/lib/api/types";

const PAGE_SIZE = 12;

/** /collections/:id — products belonging to one admin-curated collection. */
export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCollectionProducts(id, { page, limit: PAGE_SIZE });
      setCollectionName(res.data.collection.name);
      setProducts(res.data.products);
      setTotalPages(res.data.meta?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container">
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/collections">Collections</Link>
            <span aria-hidden>/</span>
            <span>{collectionName ?? "…"}</span>
          </nav>
          <h1 className="nx-page-title" style={{ marginBottom: 24 }}>{collectionName ?? "Collection"}</h1>

          {loading ? (
            <p style={{ color: "var(--nx-muted, #6b7280)" }}>Loading products…</p>
          ) : error ? (
            <p style={{ color: "#b91c1c" }}>{error}</p>
          ) : products.length === 0 ? (
            <p style={{ color: "var(--nx-muted, #6b7280)" }}>No products in this collection yet.</p>
          ) : (
            <>
              <div className="nx-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
                {products.map((p) => (
                  <NexaProductCard key={p.id} p={p} />
                ))}
              </div>
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
                  <button className="nx-btn nx-btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                  <span style={{ alignSelf: "center", fontSize: 14 }}>{page} / {totalPages}</span>
                  <button className="nx-btn nx-btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
