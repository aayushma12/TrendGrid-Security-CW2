"use client";

import Image from "next/image";
import { useState } from "react";
import { fashionSrc } from "@/lib/fashion-images";
import { FadeUp } from "./motion";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue, repeaterItems } from "@/lib/homepage-helpers";

const DEFAULT_FAQS = [
  {
    q: "Who is this fashion platform designed for?",
    a: "Our platform is built for modern shoppers who want premium fashion inspiration, stylish outfit collections, and a better online shopping experience.",
  },
  {
    q: "What comes with my membership or purchase?",
    a: "Every order includes free returns within 30 days, styling tips for your pieces, and early access to seasonal drops and member-only offers.",
  },
  {
    q: "How long can I access my account and orders?",
    a: "Your account, order history, and wishlist stay available for as long as you keep your account — there is no expiry or renewal required.",
  },
  {
    q: "Do you offer quality assurance on products?",
    a: "Yes. Every garment passes a multi-point inspection covering fabric, stitching, and fit before it ships, and is backed by our quality guarantee.",
  },
  {
    q: "Which payment methods do you support?",
    a: "We accept all major credit and debit cards, PayPal, and popular digital wallets. All payments are processed over encrypted connections.",
  },
];

/** FAQ accordion with the open item inverted to dark. */
export function NexaFaq() {
  const [open, setOpen] = useState(0);
  const { content, visible } = useHomepageSection("sec_faq");
  const heading = fieldValue(content, "heading", "Common Questions & Answers");
  const faqs = repeaterItems(content, "items", DEFAULT_FAQS);

  if (!visible) return null;

  return (
    <section className="nx-section" id="faq">
      <div className="nx-container nx-faq">
        <FadeUp>
          <div className="nx-faq-photo">
            <Image
              src={fashionSrc("wardrobe rack shirts boutique", 900, 990)}
              alt="Browsing shirts on a boutique rack"
              width={900}
              height={990}
            />
          </div>
        </FadeUp>

        <div>
          <FadeUp>
            <h2 className="nx-h2">{heading}</h2>
          </FadeUp>
          <div className="nx-faq-list">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <FadeUp key={f.q} delay={i * 0.06}>
                  <div className={`nx-faq-item${isOpen ? " is-open" : ""}`}>
                    <button
                      className="nx-faq-q"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                    >
                      {f.q}
                      <span className="nx-faq-icon" aria-hidden>
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    <div className="nx-faq-a">
                      <div className="nx-faq-a-inner">
                        <p>{f.a}</p>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
