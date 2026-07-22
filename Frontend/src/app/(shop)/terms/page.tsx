import Link from "next/link";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { STORE } from "@/lib/shop-data";

export const metadata = {
  title: "Terms of Service",
};

/** /terms — static Terms of Service, linked from the registration checkbox and footer. */
export default function TermsPage() {
  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container" style={{ maxWidth: 720 }}>
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>Terms of Service</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">Terms of Service</h1>
          </div>

          <div className="nx-form-card" style={{ display: "block", lineHeight: 1.7, fontSize: 14.5 }}>
            <p>
              By creating an account with {STORE.name} you agree to the following terms. This is a
              summary for a coursework/demo storefront, not a substitute for professional legal advice.
            </p>

            <h3>1. Your account</h3>
            <p>
              You are responsible for the accuracy of the information you provide and for keeping your
              password and any multi-factor authentication method secure. Notify us immediately of any
              unauthorized use of your account.
            </p>

            <h3>2. Acceptable use</h3>
            <p>
              You agree not to misuse the platform: no attempting to bypass authentication or rate
              limiting, no scraping at abusive volume, and no using the store for unlawful purchases or
              payment fraud.
            </p>

            <h3>3. Orders and payments</h3>
            <p>
              Placing an order is an offer to purchase, which we may accept or decline. Prices, stock,
              and availability may change at any time prior to order confirmation.
            </p>

            <h3>4. Termination</h3>
            <p>
              We may suspend or terminate accounts that violate these terms, including repeated failed
              login attempts consistent with abuse or fraud.
            </p>

            <h3>5. Changes</h3>
            <p>
              We may update these terms from time to time. Continued use of the account after a change
              constitutes acceptance of the updated terms.
            </p>

            <p style={{ color: "var(--nx-muted, #6b7280)", marginTop: 24 }}>
              Questions about these terms? Contact us at {STORE.email}.
            </p>
          </div>
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
