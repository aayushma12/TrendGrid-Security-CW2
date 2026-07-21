"use client";

import Image from "next/image";
import Link from "next/link";
import { fashionSrc } from "@/lib/fashion-images";
import { CountUp, FadeUp, Parallax } from "./motion";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue } from "@/lib/homepage-helpers";

/** About block: eyebrow rail, big heading, photo + animated stat bento. */
export function NexaAbout() {
  const { content, visible } = useHomepageSection("sec_about");
  const eyebrow = fieldValue(content, "eyebrow", "About us");
  const ctaText = fieldValue(content, "ctaText", "Learn More About Us");
  const heading = fieldValue(
    content,
    "heading",
    "Where Timeless Heritage Meets Refined Modern Craftsmanship",
  );
  const image1 = fieldValue(content, "image1", "street style jacket city");
  const image2 = fieldValue(content, "image2", "tailored coat fitting boutique");

  if (!visible) return null;

  return (
    <section className="nx-section" id="about">
      <div className="nx-container nx-about">
        <div className="nx-about-rail">
          <span className="nx-eyebrow">{eyebrow}</span>
          <Link href="/shop" className="nx-btn nx-btn-accent">
            {ctaText}
            <svg className="nx-btn-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <div>
          <FadeUp>
            <h2 className="nx-h2">
              {heading}
            </h2>
          </FadeUp>

          <div className="nx-about-grid">
            <FadeUp>
              <Parallax range={28}>
                <div className="nx-about-photo">
                  <Image
                    src={fashionSrc(image1, 860, 540)}
                    alt="Street style look in the city"
                    width={860}
                    height={540}
                  />
                </div>
              </Parallax>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="nx-stat">
                <span className="nx-stat-value">
                  <CountUp to={245} suffix="K" />
                </span>
                <span className="nx-stat-label">Style Inspired Users</span>
              </div>
            </FadeUp>
            <FadeUp delay={0.08}>
              <div className="nx-stat">
                <span className="nx-stat-value">
                  <CountUp to={9.5} decimals={1} suffix="/10" />
                </span>
                <span className="nx-stat-label">Customer Satisfaction</span>
              </div>
            </FadeUp>
            <FadeUp delay={0.16}>
              <Parallax range={28}>
                <div className="nx-about-photo">
                  <Image
                    src={fashionSrc(image2, 860, 540)}
                    alt="Tailored coat fitting in the boutique"
                    width={860}
                    height={540}
                  />
                </div>
              </Parallax>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
