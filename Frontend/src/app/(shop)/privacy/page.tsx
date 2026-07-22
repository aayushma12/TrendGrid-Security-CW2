import Link from "next/link";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { STORE } from "@/lib/shop-data";

export const metadata = {
  title: "Privacy Policy",
};

/** /privacy — static Privacy Policy, linked from the registration checkbox and footer. */
export default function PrivacyPage() {
  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container" style={{ maxWidth: 720 }}>
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>Privacy Policy</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">Privacy Policy</h1>
          </div>

          <div className="nx-form-card" style={{ display: "block", lineHeight: 1.7, fontSize: 14.5 }}>
            <p>
              This policy explains what account and order data {STORE.name} collects and how it is
              protected. This is a summary for a coursework/demo storefront, not a substitute for
              professional legal advice.
            </p>

            <h3>1. What we collect</h3>
            <p>
              Account details you provide at registration (name, email, phone), your order and address
              history, and security metadata needed to protect your account (failed login counts,
              session/device information, MFA enrollment status).
            </p>

            <h3>2. How we protect it</h3>
            <p>
              Passwords are hashed, never stored in plain text. Shipping/billing addresses and
              authenticator secrets are encrypted at rest. Sessions use short-lived access tokens with
              rotating refresh tokens, and repeated failed logins trigger rate limiting, temporary
              account lockout, and CAPTCHA challenges.
            </p>

            <h3>3. How we use it</h3>
            <p>
              To process orders, secure your account (including sending email verification and one-time
              codes for multi-factor authentication), and communicate order/security updates. We do not
              sell your personal data.
            </p>

            <h3>4. Your choices</h3>
            <p>
              You can enable or disable multi-factor authentication, change your password, and sign out
              of all devices at any time from your profile.
            </p>

            <p style={{ color: "var(--nx-muted, #6b7280)", marginTop: 24 }}>
              Questions about this policy? Contact us at {STORE.email}.
            </p>
          </div>
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
