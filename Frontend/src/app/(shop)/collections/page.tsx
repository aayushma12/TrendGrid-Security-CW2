"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { listActiveCollections } from "@/lib/api/collections";
import type { CollectionDto } from "@/lib/api/collections";

/** /collections — index of admin-curated storefront collections (Men, Summer Collection, ...). */
export default function CollectionsIndexPage() {
  const [collections, setCollections] = useState<CollectionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listActiveCollections()
      .then((res) => setCollections(res.data))
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container">
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>Collections</span>
          </nav>
          <h1 className="nx-page-title" style={{ marginBottom: 24 }}>Shop by Collection</h1>

          {loading ? (
            <p style={{ color: "var(--nx-muted, #6b7280)" }}>Loading collections…</p>
          ) : collections.length === 0 ? (
            <p style={{ color: "var(--nx-muted, #6b7280)" }}>No collections available right now.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href={`/collections/${c.id}`}
                  style={{
                    display: "block", borderRadius: 16, overflow: "hidden",
                    border: "1px solid var(--nx-line, #e5e5e5)", textDecoration: "none", color: "inherit",
                  }}
                >
                  <div style={{ aspectRatio: "4 / 3", background: "#f2f2f2", position: "relative" }}>
                    {c.imageUrl ? (
                      <Image src={c.imageUrl} alt={c.name} fill unoptimized style={{ objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 32 }}>🏷️</div>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{c.name}</h3>
                    {c.productCount !== undefined && (
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--nx-muted, #6b7280)" }}>
                        {c.productCount} product{c.productCount === 1 ? "" : "s"}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
