"use client";

/**
 * ScrollScene — a generic wrapper that turns any block into a scroll-driven
 * scene. It mounts the shared useScrollProgress engine and exposes `--p` on its
 * root element, so the children animate entirely in CSS.
 *
 * Mark the element that should drive the timing with `data-scroll-track` (e.g.
 * the chart/visual itself); otherwise the whole scene is used.
 *
 *   <ScrollScene className="my-band" start={0.9} end={0.3}>
 *     <header>…</header>
 *     <div className="my-visual" data-scroll-track>…</div>
 *   </ScrollScene>
 */

import { type ReactNode } from "react";
import {
  useScrollProgress,
  type ScrollProgressOptions,
} from "@/lib/useScrollProgress";

type ScrollSceneProps = {
  children: ReactNode;
  className?: string;
} & ScrollProgressOptions &
  Omit<React.HTMLAttributes<HTMLElement>, "onProgress">;

export function ScrollScene({
  children,
  className = "",
  start,
  end,
  onProgress,
  ...rest
}: ScrollSceneProps) {
  const ref = useScrollProgress<HTMLElement>({ start, end, onProgress });
  return (
    <section ref={ref} className={`scroll-scene ${className}`.trim()} {...rest}>
      {children}
    </section>
  );
}
