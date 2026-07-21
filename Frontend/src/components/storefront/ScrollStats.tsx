"use client";

/**
 * ScrollStats — animated "By the Numbers" data-viz band.
 *
 * A structured example of building a scroll-driven visualisation on the shared
 * engine. The section is a <ScrollScene>, so it exposes `--p` (0 -> 1); each
 * metric's circular progress ring fills from that variable as the visitor
 * scrolls (the ring's stroke-dashoffset is interpolated in CSS — see
 * scroll-stats.css). The headline figures count up once on entry via the
 * existing CountUp primitive, so numbers and gauges animate in concert.
 *
 * To add / change a metric, edit METRICS below — no motion code to touch.
 */

import { ScrollScene } from "@/components/storefront/ScrollScene";
import { CountUp } from "@/components/storefront/HomeMotion";

type Metric = {
  /** Target number for the count-up. */
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  /** How full the ring draws at progress = 1 (0..1). */
  frac: number;
};

const METRICS: Metric[] = [
  { value: 98,   suffix: "%",  label: "On-time delivery",   frac: 0.98 },
  { value: 45,   suffix: "k+", label: "Happy customers",    frac: 0.9 },
  { value: 4.9,  decimals: 1, suffix: "/5", label: "Average rating", frac: 0.98 },
  { value: 30,   suffix: "d",  label: "Easy returns window", frac: 0.82 },
];

/* Circumference of the ring (r = 54): 2 * PI * 54. */
const CIRC = 339.292;

export function ScrollStats() {
  return (
    <ScrollScene
      className="scroll-stats"
      start={0.9}
      end={0.35}
      aria-labelledby="stats-heading"
    >
      <div className="container">
        <header className="section-head scroll-stats__head">
          <p className="eyebrow">By the Numbers</p>
          <h2 id="stats-heading" className="section-title">
            A house built on trust
          </h2>
          <p className="muted text-sm section-subtext">
            The figures behind every order &mdash; watch them fill as you scroll.
          </p>
        </header>

        <div className="scroll-stats__grid" data-scroll-track>
          {METRICS.map((m, i) => (
            <figure
              key={m.label}
              className="scroll-stats__card"
              style={
                {
                  "--frac": String(m.frac),
                  "--circ": String(CIRC),
                  "--i": String(i),
                } as React.CSSProperties
              }
            >
              <div className="scroll-stats__ring" aria-hidden>
                <svg viewBox="0 0 120 120">
                  <circle className="scroll-stats__track" cx="60" cy="60" r="54" />
                  <circle className="scroll-stats__fill" cx="60" cy="60" r="54" />
                </svg>
                <span className="scroll-stats__num">
                  <CountUp
                    end={m.value}
                    decimals={m.decimals ?? 0}
                    prefix={m.prefix ?? ""}
                    suffix={m.suffix ?? ""}
                  />
                </span>
              </div>
              <figcaption className="scroll-stats__label">{m.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </ScrollScene>
  );
}
