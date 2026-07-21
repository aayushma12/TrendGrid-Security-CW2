"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { NexaProductCard } from "@/components/home-nexa/NexaProductCard";
import { FadeUp } from "@/components/home-nexa/motion";
import { useStore } from "@/lib/store-context";
import { useAuth } from "@/lib/auth-context";
import { getProduct } from "@/lib/api/products";
import { formatPrice } from "@/lib/shop-data";
import type { ProductDto } from "@/lib/api/types";
import { MfaEnrollmentCard } from "@/components/auth/MfaEnrollmentCard";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { LogoutAllButton } from "@/components/auth/LogoutAllButton";
import { PasswordExpiredBanner } from "@/components/auth/PasswordExpiredBanner";

/** /profile — real signed-in account summary + wishlist (wishlist itself stays local — no backend feature for it yet). */
export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { wishlist, count, subtotal, showToast } = useStore();
  const [wished, setWished] = useState<ProductDto[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  useEffect(() => {
    // No special-case for an empty wishlist needed: Promise.all([]) resolves
    // to [] on its own, so this stays a single code path either way.
    // The loading flag itself is the canonical exception to
    // react-hooks/set-state-in-effect — "kick off an async fetch and flip a
    // loading flag when a dependency changes" is a recommended effect use,
    // not the derived-state anti-pattern the rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingWishlist(true);
    Promise.all(wishlist.map((id) => getProduct(id).then((r) => r.data).catch(() => null)))
      .then((results) => setWished(results.filter((p): p is ProductDto => Boolean(p))))
      .finally(() => setLoadingWishlist(false));
  }, [wishlist]);

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "Your Profile";
  const initials = user ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}` : "TG";

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container">
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>Profile</span>
          </nav>

          {authLoading ? (
            <p style={{ padding: "40px 0", color: "var(--nx-muted, #6b7280)" }}>Loading…</p>
          ) : !isAuthenticated || !user ? (
            <div className="nx-empty">
              <strong>Sign in to view your profile</strong>
              Your account, orders and wishlist are all in one place once you&apos;re signed in.
              <div style={{ marginTop: 20 }}>
                <Link href="/login?redirect=/profile" className="nx-btn nx-btn-accent">
                  Sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <PasswordExpiredBanner onChangePassword={() => document.getElementById("security")?.scrollIntoView({ behavior: "smooth" })} />

              <div className="nx-profile-hero">
                <span className="nx-avatar-big" aria-hidden>{initials.toUpperCase()}</span>
                <div>
                  <h1 className="nx-page-title" style={{ fontSize: "clamp(1.7rem,3.4vw,2.4rem)" }}>
                    {displayName}
                  </h1>
                  <p className="nx-result-note">{user.email}</p>
                </div>
                <div className="nx-profile-badges">
                  <span className="nx-chip">
                    <span className="nx-chip-icon" aria-hidden>♥</span>
                    {wishlist.length} Wishlisted
                  </span>
                  <span className="nx-chip">
                    <span className="nx-chip-icon is-check" aria-hidden>🛒</span>
                    {count} in Cart
                  </span>
                </div>
              </div>

              <div className="nx-profile-grid">
                <FadeUp>
                  <div className="nx-form-card">
                    <h3>Account Details</h3>
                    <div className="nx-form-grid">
                      <div className="nx-field">
                        <label>First name</label>
                        <input className="nx-input" value={user.firstName} disabled />
                      </div>
                      <div className="nx-field">
                        <label>Last name</label>
                        <input className="nx-input" value={user.lastName} disabled />
                      </div>
                      <div className="nx-field is-full">
                        <label>Email</label>
                        <input className="nx-input" value={user.email} disabled />
                      </div>
                      <div className="nx-field is-full">
                        <label>Phone</label>
                        <input className="nx-input" value={user.phoneNumber ?? ""} placeholder="Not set" disabled />
                      </div>
                    </div>
                    <p className="nx-free-ship" style={{ marginTop: 12 }}>
                      Account details are managed by our team for now — contact support to update them.
                    </p>
                  </div>
                </FadeUp>

                <FadeUp delay={0.1}>
                  <aside className="nx-summary">
                    <h3>Quick Actions</h3>
                    <div className="nx-side-list">
                      <Link href="/cart" className="nx-side-btn">
                        Your cart <small>{count} items · {formatPrice(subtotal)}</small>
                      </Link>
                      <Link href="/orders" className="nx-side-btn">
                        My orders
                      </Link>
                      <Link href="/track" className="nx-side-btn">
                        Track an order
                      </Link>
                      <Link href="/shop" className="nx-side-btn">
                        Continue shopping
                      </Link>
                      <Link href="/contact" className="nx-side-btn">
                        Contact support
                      </Link>
                      <button
                        type="button"
                        className="nx-side-btn"
                        onClick={() => {
                          logout();
                          showToast("Signed out");
                        }}
                      >
                        Log out
                      </button>
                    </div>
                    <p className="nx-free-ship" style={{ marginTop: 18 }}>
                      Your wishlist is stored on this device.
                    </p>
                  </aside>
                </FadeUp>
              </div>

              <section className="nx-related" id="security">
                <FadeUp>
                  <div className="nx-section-head">
                    <h2 className="nx-h2">Security</h2>
                  </div>
                </FadeUp>
                <div className="nx-profile-grid">
                  <FadeUp>
                    <ChangePasswordForm />
                  </FadeUp>
                  <FadeUp delay={0.1}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <MfaEnrollmentCard />
                      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px", background: "#fff" }}>
                        <h3 style={{ margin: "0 0 6px" }}>Sessions</h3>
                        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
                          Signed in somewhere you don&apos;t recognize? Sign out of every device at once.
                        </p>
                        <LogoutAllButton redirectTo="/login" />
                      </div>
                    </div>
                  </FadeUp>
                </div>
              </section>

              <section className="nx-related" id="wishlist">
                <FadeUp>
                  <div className="nx-section-head">
                    <h2 className="nx-h2">Your Wishlist</h2>
                  </div>
                </FadeUp>
                {loadingWishlist ? (
                  <p style={{ color: "var(--nx-muted, #6b7280)" }}>Loading wishlist…</p>
                ) : wished.length === 0 ? (
                  <div className="nx-empty">
                    <strong>No favourites yet</strong>
                    Tap the wishlist button on any product to save it here.
                    <div style={{ marginTop: 20 }}>
                      <Link href="/shop" className="nx-btn nx-btn-accent">
                        Explore Collection
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="nx-grid-4">
                    {wished.map((p, i) => (
                      <FadeUp key={p.id} delay={i * 0.06}>
                        <NexaProductCard p={p} />
                      </FadeUp>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
