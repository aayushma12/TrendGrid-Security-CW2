"use client";

/**
 * Shared motion primitives for the Nexa home design.
 * All helpers respect prefers-reduced-motion and animate once on entry.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  animate,
} from "framer-motion";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------- FadeUp */

export function FadeUp({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* --------------------------------------------------------- SplitWords */

/** Staggered word-by-word rise, each word masked by an overflow clip. */
export function SplitWords({
  text,
  delay = 0,
  stagger = 0.055,
  className,
}: {
  text: string;
  delay?: number;
  stagger?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span className="nx-word-mask" key={`${w}-${i}`} aria-hidden>
          <motion.span
            className="nx-word"
            initial={reduce ? false : { y: "110%", rotate: 4 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{
              duration: 0.9,
              delay: delay + i * stagger,
              ease: EASE,
            }}
          >
            {w}
          </motion.span>{" "}
        </span>
      ))}
    </span>
  );
}

/* -------------------------------------------------------- SplitLetters */

/** Per-letter masked rise. Words stay unbreakable; spacing via CSS margin. */
export function SplitLetters({
  text,
  delay = 0,
  stagger = 0.03,
  className,
}: {
  text: string;
  delay?: number;
  stagger?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  let idx = 0;
  return (
    <span className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span className="nx-letter-word" key={`${word}-${wi}`} aria-hidden>
          {Array.from(word).map((ch, ci) => {
            const i = idx++;
            return (
              <span className="nx-letter-mask" key={ci}>
                <motion.span
                  className="nx-letter"
                  initial={reduce ? false : { y: "115%" }}
                  animate={{ y: "0%" }}
                  transition={{
                    duration: 0.85,
                    delay: delay + i * stagger,
                    ease: EASE,
                  }}
                >
                  {ch}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/* ----------------------------------------------------------- Parallax */

/** Gentle scroll-linked vertical drift. `range` = total px travelled. */
export function Parallax({
  children,
  range = 56,
  className,
}: {
  children: ReactNode;
  range?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [range / 2, -range / 2]);
  const y = useSpring(raw, { stiffness: 90, damping: 24, mass: 0.6 });
  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { y }}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------ CountUp */

/** Counts from 0 to `to` when scrolled into view. */
export function CountUp({
  to,
  decimals = 0,
  suffix = "",
  duration = 1.6,
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: EASE,
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------- Float */

/** Slow perpetual bob for badges / decorations. */
export function Float({
  children,
  className,
  amount = 7,
  duration = 4.5,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduce ? undefined : { y: [0, -amount, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
