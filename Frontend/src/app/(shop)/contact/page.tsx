"use client";

import { useState } from "react";
import Link from "next/link";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { FadeUp } from "@/components/home-nexa/motion";
import { useStore } from "@/lib/store-context";
import { STORE } from "@/lib/shop-data";

const INFO = [
  {
    title: "Email Us",
    value: STORE.email,
    note: "We reply within one business day.",
    icon: "M4 6h16v12H4z M4 7l8 6 8-6",
  },
  {
    title: "Call Us",
    value: STORE.phone,
    note: `Support line: ${STORE.supportPhone}`,
    icon: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  },
  {
    title: "Visit Us",
    value: STORE.address,
    note: "Mon–Sat, 10:00 – 19:00",
    icon: "M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11z M12 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  },
];

/** /contact — Nexa-themed contact page: info cards + message form. */
export default function ContactPage() {
  const { showToast } = useStore();
  const [sending, setSending] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const form = e.currentTarget;
    setTimeout(() => {
      form.reset();
      setSending(false);
      showToast("Message sent — we will get back to you soon!", 5000);
    }, 700);
  }

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container">
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>Contact</span>
          </nav>

          <div className="nx-page-head">
            <div>
              <h1 className="nx-page-title">Get in Touch</h1>
              <p className="nx-result-note" style={{ marginTop: 8, maxWidth: "48ch" }}>
                Questions about an order, sizing, or a collaboration? Send us a
                message — we would love to hear from you.
              </p>
            </div>
          </div>

          <div className="nx-contact">
            <div className="nx-contact-info">
              {INFO.map((c, i) => (
                <FadeUp key={c.title} delay={i * 0.08}>
                  <div className="nx-info-card">
                    <span className="nx-info-icon" aria-hidden>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={c.icon} />
                      </svg>
                    </span>
                    <div>
                      <h3>{c.title}</h3>
                      <p className="nx-info-value">{c.value}</p>
                      <p className="nx-info-note">{c.note}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
              <FadeUp delay={0.26}>
                <div className="nx-info-card is-accent">
                  <div>
                    <h3>Need a quick answer?</h3>
                    <p className="nx-info-note">
                      Most questions are covered in our FAQ on the home page.
                    </p>
                    <Link href="/#faq" className="nx-btn nx-btn-dark" style={{ marginTop: 14 }}>
                      Read the FAQ
                    </Link>
                  </div>
                </div>
              </FadeUp>
            </div>

            <FadeUp delay={0.1}>
              <form className="nx-form-card" onSubmit={submit}>
                <h3>Send a Message</h3>
                <div className="nx-form-grid">
                  <div className="nx-field">
                    <label htmlFor="c-name">Name</label>
                    <input id="c-name" className="nx-input" required placeholder="Your name" />
                  </div>
                  <div className="nx-field">
                    <label htmlFor="c-email">Email</label>
                    <input id="c-email" type="email" className="nx-input" required placeholder="you@example.com" />
                  </div>
                  <div className="nx-field is-full">
                    <label htmlFor="c-subject">Subject</label>
                    <select id="c-subject" className="nx-input" defaultValue="Order support">
                      <option>Order support</option>
                      <option>Sizing question</option>
                      <option>Returns &amp; refunds</option>
                      <option>Partnership / collaboration</option>
                      <option>Something else</option>
                    </select>
                  </div>
                  <div className="nx-field is-full">
                    <label htmlFor="c-msg">Message</label>
                    <textarea id="c-msg" className="nx-input" rows={6} required placeholder="How can we help?" />
                  </div>
                </div>
                <button type="submit" className="nx-btn nx-btn-accent" style={{ marginTop: 18 }} disabled={sending}>
                  {sending ? "Sending…" : "Send Message"}
                  <svg className="nx-btn-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </form>
            </FadeUp>
          </div>
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
