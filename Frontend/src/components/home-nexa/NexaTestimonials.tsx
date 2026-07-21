"use client";

import Image from "next/image";
import { fashionSrc } from "@/lib/fashion-images";
import { FadeUp } from "./motion";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue, repeaterItems } from "@/lib/homepage-helpers";

const DEFAULT_QUOTES = [
  {
    name: "Daniel Carter",
    seed: "men avatar daniel shirt",
    text: "The clean stitching and premium fit make every outfit feel stylish and comfortable all day.",
  },
  {
    name: "Ryan Mitchell",
    seed: "men avatar ryan coat",
    text: "Excellent fabric quality with a modern look that instantly upgrades my wardrobe.",
  },
  {
    name: "Ethan Walker",
    seed: "men avatar ethan suit",
    text: "Minimal, classy, and incredibly comfortable — exactly what I look for in fashion.",
  },
  {
    name: "Lucas Bennett",
    seed: "men avatar lucas sweater",
    text: "The details, fit, and overall design feel premium and worth every penny.",
  },
];

/** Four-up testimonial cards. */
export function NexaTestimonials() {
  const { content, visible } = useHomepageSection("sec_testimonials");
  const heading = fieldValue(content, "heading", "Smarter Fashion Starts Here");
  const subtext = fieldValue(
    content,
    "subtext",
    "See why modern shoppers trust our premium fashion experience and everyday style collections.",
  );
  const quotes = repeaterItems(content, "quotes", DEFAULT_QUOTES);

  if (!visible) return null;

  return (
    <section className="nx-section">
      <div className="nx-container">
        <FadeUp>
          <div className="nx-section-head">
            <h2 className="nx-h2">{heading}</h2>
            <p className="nx-sub">{subtext}</p>
          </div>
        </FadeUp>

        <div className="nx-quotes">
          {quotes.map((q, i) => (
            <FadeUp key={`${q.name}-${i}`} delay={i * 0.08}>
              <figure className="nx-quote">
                <div>
                  <div className="nx-stars" aria-label="5 out of 5 stars">★★★★★</div>
                  <blockquote>
                    <p>&ldquo;{q.text}&rdquo;</p>
                  </blockquote>
                </div>
                <figcaption className="nx-quote-who">
                  <Image src={fashionSrc(q.seed, 68, 68)} alt="" width={34} height={34} />
                  {q.name}
                </figcaption>
              </figure>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
