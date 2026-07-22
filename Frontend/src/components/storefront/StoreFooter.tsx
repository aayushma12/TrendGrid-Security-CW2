import Link from "next/link";
import { STORE, FEATURES } from "@/lib/shop-data";

const COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/shop" },
      { label: "Blog", href: "/shop" },
      { label: "Contact Us", href: "/shop" },
      { label: "Career", href: "/shop" },
    ],
  },
  {
    title: "Customer Services",
    links: [
      { label: "My Account", href: "/profile" },
      { label: "Track Your Order", href: "/track" },
      { label: "Return", href: "/shop" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Our Information",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "User Terms & Condition", href: "/terms" },
      { label: "Return Policy", href: "/shop" },
    ],
  },
];

const SOCIALS = [
  { label: "Facebook", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
  { label: "Blog", path: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" },
  { label: "YouTube", path: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
  { label: "Twitter", path: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" },
  { label: "Instagram", path: "M2 2m0 5a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5z M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" },
];

function FeatureIcon({ icon }: { icon: string }) {
  if (icon === "shipping")
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    );
  if (icon === "payment")
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    );
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.23h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.96-.85a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.72 16z" />
    </svg>
  );
}

export function Features() {
  return (
    <section className="section--tight">
      <div className="container">
        <div className="features">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature">
              <div className="feature__icon">
                <FeatureIcon icon={f.icon} />
              </div>
              <div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StoreFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <Link href="/" className="brand">
              <span className="brand__mark">C</span>
              {STORE.name}
            </Link>
            <p className="footer__about">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <div className="footer__socials">
              {SOCIALS.map((s) => (
                <button key={s.label} type="button" className="icon-btn icon-btn--sm" aria-label={s.label}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4>Contact Info</h4>
            <ul>
              <li>{STORE.phone}</li>
              <li>{STORE.email}</li>
              <li>{STORE.address}</li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>Copyright © 2024 Clothing Website Design. All Rights Reserved.</span>
          <div className="footer__bottom-end">
            <span>English ↓</span>
            <span>NPR ↓</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
