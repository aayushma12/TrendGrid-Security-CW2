import type { CSSProperties, ReactNode } from "react";

/**
 * Subset of theme/section fields that define a background pattern. Sections can
 * override the global theme pattern by passing their own config.
 */
export interface PatternConfig {
  patternType: string;
  patternColorA: string;
  patternColorB: string;
  patternColorC: string;
  patternOpacity: number;
  patternSize: string;
  patternAngle: number;
  patternBlur: string;
  patternSaturation: number;
  overlayType: string;
  overlayColor: string;
  overlayOpacity: number;
  overlayBlendMode: string;
}

function px(size: string): number {
  const n = parseInt(size, 10);
  return Number.isFinite(n) ? n : 24;
}

/**
 * Build the CSS `background` layers for a given pattern type. Returns a style
 * object applied to the absolutely-positioned pattern layer.
 */
function patternStyle(c: PatternConfig): CSSProperties {
  const a = c.patternColorA;
  const b = c.patternColorB;
  const d = c.patternColorC;
  const angle = `${c.patternAngle}deg`;
  const size = c.patternSize;
  const s = px(size);
  const half = Math.max(1, Math.round(s / 2));

  const base: CSSProperties = { opacity: c.patternOpacity };

  switch (c.patternType) {
    case "solid":
      return { ...base, backgroundColor: a };

    case "linearGradient":
      return { ...base, backgroundImage: `linear-gradient(${angle}, ${a}, ${b})` };

    case "radialGradient":
      return {
        ...base,
        backgroundImage: `radial-gradient(circle at 50% 40%, ${a}, ${b})`,
      };

    case "angularGradient":
      return {
        ...base,
        backgroundImage: `conic-gradient(from ${angle}, ${a}, ${b}, ${a})`,
      };

    case "meshGradient":
      return {
        ...base,
        backgroundColor: a,
        backgroundImage: [
          `radial-gradient(at 0% 0%, ${a} 0px, transparent 50%)`,
          `radial-gradient(at 100% 0%, ${b} 0px, transparent 50%)`,
          `radial-gradient(at 50% 100%, ${d} 0px, transparent 50%)`,
        ].join(", "),
      };

    case "dotGrid":
      return {
        ...base,
        backgroundColor: a,
        backgroundImage: `radial-gradient(${b} ${Math.max(1, Math.round(s / 8))}px, transparent ${Math.max(1, Math.round(s / 8))}px)`,
        backgroundSize: `${size} ${size}`,
      };

    case "lineGrid":
      return {
        ...base,
        backgroundColor: a,
        backgroundImage: `linear-gradient(${b} 1px, transparent 1px), linear-gradient(90deg, ${b} 1px, transparent 1px)`,
        backgroundSize: `${size} ${size}`,
      };

    case "crossGrid":
      return {
        ...base,
        backgroundColor: a,
        backgroundImage: `linear-gradient(${b} 1px, transparent 1px), linear-gradient(90deg, ${b} 1px, transparent 1px)`,
        backgroundSize: `${size} ${size}`,
        backgroundPosition: `${half}px ${half}px`,
      };

    case "diagonalLines":
      return {
        ...base,
        backgroundColor: a,
        backgroundImage: `repeating-linear-gradient(${angle}, ${b} 0, ${b} 2px, transparent 2px, transparent ${size})`,
      };

    case "chevronPattern":
      return {
        ...base,
        backgroundColor: a,
        backgroundImage: `repeating-linear-gradient(45deg, ${b} 0 2px, transparent 2px ${half}px), repeating-linear-gradient(-45deg, ${b} 0 2px, transparent 2px ${half}px)`,
      };

    case "herringbone":
      return {
        ...base,
        backgroundColor: a,
        backgroundImage: `repeating-linear-gradient(45deg, ${b} 0 1px, transparent 1px ${size}), repeating-linear-gradient(135deg, ${b} 0 1px, transparent 1px ${size})`,
      };

    case "carbonFiber":
      return {
        ...base,
        backgroundColor: a,
        backgroundImage: `radial-gradient(${b} 1px, transparent 1px), radial-gradient(${b} 1px, ${a} 1px)`,
        backgroundSize: `${size} ${size}`,
        backgroundPosition: `0 0, ${half}px ${half}px`,
      };

    case "glassmorphism":
    case "frostedGlass":
      return {
        ...base,
        backgroundColor: hexWithAlpha(a, 0.18),
        backdropFilter: `blur(${c.patternBlur || "12px"}) saturate(${c.patternSaturation}%)`,
        WebkitBackdropFilter: `blur(${c.patternBlur || "12px"}) saturate(${c.patternSaturation}%)`,
      };

    case "linen":
    case "paper":
      return {
        ...base,
        backgroundColor: a,
        backgroundImage: `repeating-linear-gradient(0deg, ${hexWithAlpha(b, 0.04)} 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, ${hexWithAlpha(b, 0.04)} 0 1px, transparent 1px 3px)`,
      };

    case "concrete":
    case "marble":
      return {
        ...base,
        backgroundColor: a,
        backgroundImage: `radial-gradient(circle at 20% 30%, ${hexWithAlpha(b, 0.25)}, transparent 40%), radial-gradient(circle at 80% 70%, ${hexWithAlpha(d, 0.2)}, transparent 45%)`,
      };

    // SVG-based patterns get a data-URI background
    case "waves":
    case "noiseTecture":
    case "geometricHexagon":
    case "geometricTriangle":
    case "geometricCircles":
    case "topographicMap":
    case "circuitBoard":
      return {
        ...base,
        backgroundColor: a,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svgFor(c))}")`,
        backgroundSize: `${size} ${size}`,
      };

    default:
      return { ...base, backgroundColor: a };
  }
}

/** Inline SVG tiles for the patterns that can't be expressed as gradients. */
function svgFor(c: PatternConfig): string {
  const s = px(c.patternSize);
  const a = c.patternColorA;
  const b = c.patternColorB;
  switch (c.patternType) {
    case "waves":
      return `<svg xmlns='http://www.w3.org/2000/svg' width='${s * 4}' height='${s}' viewBox='0 0 ${s * 4} ${s}'><path d='M0 ${s / 2} q ${s} -${s / 2} ${s * 2} 0 t ${s * 2} 0' fill='none' stroke='${b}' stroke-width='2'/></svg>`;
    case "noiseTecture":
      return `<svg xmlns='http://www.w3.org/2000/svg' width='${s * 4}' height='${s * 4}'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.25'/></svg>`;
    case "geometricHexagon":
      return `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 100 100'><polygon points='50,3 95,25 95,75 50,97 5,75 5,25' fill='none' stroke='${b}' stroke-width='3'/></svg>`;
    case "geometricTriangle":
      return `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 100 100'><polygon points='50,5 95,95 5,95' fill='none' stroke='${b}' stroke-width='3'/></svg>`;
    case "geometricCircles":
      return `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 100 100'><circle cx='50' cy='50' r='42' fill='none' stroke='${b}' stroke-width='3'/></svg>`;
    case "topographicMap":
      return `<svg xmlns='http://www.w3.org/2000/svg' width='${s * 3}' height='${s * 3}' viewBox='0 0 100 100'><g fill='none' stroke='${b}' stroke-width='1.2' opacity='0.6'><circle cx='50' cy='50' r='12'/><circle cx='50' cy='50' r='24'/><circle cx='50' cy='50' r='36'/><circle cx='50' cy='50' r='48'/></g></svg>`;
    case "circuitBoard":
      return `<svg xmlns='http://www.w3.org/2000/svg' width='${s * 2}' height='${s * 2}' viewBox='0 0 100 100'><g fill='none' stroke='${b}' stroke-width='2'><path d='M10 10 H50 V50 H90'/><path d='M10 90 V60 H40'/><circle cx='50' cy='50' r='4' fill='${b}'/><circle cx='10' cy='10' r='4' fill='${b}'/></g></svg>`;
    default:
      return `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}'><rect width='100%' height='100%' fill='${a}'/></svg>`;
  }
}

/** Compute the overlay style sitting above the pattern. */
function overlayStyle(c: PatternConfig): CSSProperties | null {
  if (!c.overlayType || c.overlayType === "none") return null;
  const common: CSSProperties = {
    mixBlendMode: c.overlayBlendMode as CSSProperties["mixBlendMode"],
    opacity: c.overlayOpacity,
  };
  switch (c.overlayType) {
    case "color":
      return { ...common, backgroundColor: c.overlayColor };
    case "gradient":
      return {
        ...common,
        backgroundImage: `linear-gradient(${c.patternAngle}deg, ${c.overlayColor}, transparent)`,
      };
    case "vignette":
      return {
        ...common,
        backgroundImage: `radial-gradient(circle, transparent 55%, ${c.overlayColor})`,
      };
    default:
      return null;
  }
}

function hexWithAlpha(hex: string, alpha: number): string {
  if (!hex?.startsWith("#")) return hex;
  const h = hex.slice(1);
  const full =
    h.length === 3
      ? h
          .split("")
          .map((x) => x + x)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const bl = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
}

/**
 * Renders a layered background: pattern layer + optional overlay + children.
 * Supports all 25+ pattern types. Position children above with z-index.
 */
export function PatternBackground({
  config,
  className,
  style,
  children,
}: {
  config: PatternConfig;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const overlay = overlayStyle(config);
  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          ...patternStyle(config),
        }}
      />
      {overlay && (
        <div aria-hidden style={{ position: "absolute", inset: 0, ...overlay }} />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
