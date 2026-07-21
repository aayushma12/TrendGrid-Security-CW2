"use client";

/**
 * Homepage hero — choreographed entrance (eyebrow → headline words → copy →
 * CTAs → stats) + layered editorial photography with scroll parallax and
 * floating detail chips. Imagery via <ProductImage/> (curated Unsplash photos
 * through lib/fashion-images). All colors/type/radius come from theme tokens
 * via .hl-* classes (src/styles/home-luxe.css).
 */
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ProductImage } from "./ProductImage";

const EASE = [0.22, 1, 0.36, 1] as const;

const HEADLINE: Array<{ text: string; em?: boolean }> = [
  { text: "The" },
  { text: "dress" },
  { text: "you’ll" },
  { text: "live", em: true },
  { text: "in.", em: true },
];

/** Magnetic wrapper: children subtly follow the cursor, spring back on leave. */
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 16, mass: 0.4 });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      style={reduce ? undefined : { x: sx, y: sy, display: "inline-block" }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.25);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function HomeLuxeHero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Depth parallax: main photo drifts down, inset photo drifts up on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const mainY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const secondY = useTransform(scrollYProgress, [0, 1], ["0%", "-9%"]);

  const anim = (delay: number) => ({
    initial: reduce ? undefined : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.65, ease: EASE },
  });

  return (
    <section className="hl-hero" aria-label="Featured collection" ref={sectionRef}>
      <div className="container hl-hero__grid">
        <div>
          <motion.p className="hl-hero__eyebrow" {...anim(0.35)}>
            The Atelier Collection — SS26
          </motion.p>

          <h1 className="hl-hero__title" aria-label="The dress you'll live in.">
            {HEADLINE.map((w, i) => (
              <motion.span
                key={i}
                className="hl-word"
                initial={reduce ? undefined : { opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.11, duration: 0.7, ease: EASE }}
              >
                {w.em ? <em>{w.text}</em> : w.text}
                {i < HEADLINE.length - 1 ? " " : ""}
              </motion.span>
            ))}
          </h1>

          <motion.p className="hl-hero__copy" {...anim(1.05)}>
            Silk, structure, and softness — cut in small batches for the way you
            actually move through your day, and your evening.
          </motion.p>

          <motion.div className="hl-hero__ctas" {...anim(1.2)}>
            <Magnetic>
              <Link href="/shop?category=Dresses" className="btn btn--primary btn--lg">
                Shop dresses
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="#hl-story" className="btn btn--outline btn--lg">
                Our story
              </Link>
            </Magnetic>
          </motion.div>

          <motion.div className="hl-hero__meta" {...anim(1.4)}>
            <div>
              <strong>120+</strong> signature styles
            </div>
            <div>
              <strong>100%</strong> natural fabrics
            </div>
            <div>
              <strong>48h</strong> atelier dispatch
            </div>
          </motion.div>
        </div>

        {/* ------------------------------------------ editorial photo stack */}
        <motion.div
          className="hl-visual"
          initial={reduce ? undefined : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.9, ease: EASE }}
        >
          <div className="hl-visual__halo" aria-hidden />

          <motion.div className="hl-visual__main" style={reduce ? undefined : { y: mainY }}>
            <ProductImage
              seed="hero-dress-editorial-gown"
              alt="Model in a flowing dress from the Atelier Collection"
              priority
              sizes="(max-width:1024px) 100vw, 48vw"
            />
          </motion.div>

          <motion.div
            className="hl-visual__second"
            style={reduce ? undefined : { y: secondY }}
            initial={reduce ? undefined : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.7, ease: EASE }}
          >
            <ProductImage
              seed="dress-silk-fabric-detail"
              alt="Silk fabric detail"
              sizes="(max-width:1024px) 45vw, 20vw"
            />
          </motion.div>

          <motion.div
            className="hl-chip hl-chip--top"
            initial={reduce ? undefined : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.25, duration: 0.5, ease: EASE }}
          >
            <span className="hl-chip__float">
              <span className="hl-chip__pulse" aria-hidden />
              New silhouettes weekly
            </span>
          </motion.div>

          <motion.div
            className="hl-chip hl-chip--bottom"
            initial={reduce ? undefined : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.45, duration: 0.5, ease: EASE }}
          >
            <span className="hl-chip__float">
              <span className="hl-chip__star" aria-hidden>★</span>
              4.9 · 2,400 fittings
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
