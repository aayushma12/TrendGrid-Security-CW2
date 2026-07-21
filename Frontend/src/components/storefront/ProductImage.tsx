"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { fashionSrc, toneFor } from "@/lib/fashion-images";

/**
 * High-quality fashion imagery. Every seed (product id or descriptive section
 * seed) resolves to a real clothing photo via `fashionSrc`. Progressive load:
 * blur-up placeholder, data-loaded toggle, shimmer removal on the .pimg
 * wrapper, and a premium fabric-toned fallback if a photo is ever unavailable.
 */

/** Soft neutral blur placeholder shared by all imagery. */
const BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxNiI+PGZpbHRlciBpZD0iYiI+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlOWUyZDYiLz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSI2MCUiIGZpbGw9IiNkOGNkYjkiIGZpbHRlcj0idXJsKCNiKSIvPjwvc3ZnPg==";

interface SmartImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  imgClassName?: string;
  tone?: string;
  label?: string;
}

function SmartImage({
  src,
  alt,
  sizes,
  className = "pimg",
  priority = false,
  imgClassName = "pimg__img",
  tone = "#C9A87C",
  label,
}: SmartImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`${className} pimg--fallback`}
        role="img"
        aria-label={alt}
        style={{ "--fb-tone": tone } as CSSProperties}
      >
        <span className="pimg--fallback__shine" aria-hidden />
        {label && <span className="pimg--fallback__label">{label}</span>}
      </div>
    );
  }

  return (
    <div className={className}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={imgClassName}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        placeholder="blur"
        blurDataURL={BLUR}
        data-loaded="false"
        onLoad={(e) => {
          const img = e.currentTarget;
          img.setAttribute("data-loaded", "true");
          img.closest(".pimg")?.classList.add("is-loaded");
        }}
        onError={() => setError(true)}
      />
    </div>
  );
}

export function ProductImage({
  seed,
  alt = "Product",
  className = "pimg",
  sizes = "(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw",
  priority = false,
  tone,
  label,
}: {
  seed: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  tone?: string;
  label?: string;
}) {
  return (
    <SmartImage
      src={fashionSrc(seed, 600, 800)}
      alt={alt}
      sizes={sizes}
      className={className}
      priority={priority}
      tone={tone ?? toneFor(seed)}
      label={label}
    />
  );
}

export function HeroImage({
  seed,
  alt = "",
  sizes = "(max-width:1024px) 100vw, 50vw",
  priority = false,
}: {
  seed: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <SmartImage
      src={fashionSrc(seed, 720, 960)}
      alt={alt}
      sizes={sizes}
      className="hero__img-wrap"
      imgClassName="pimg__img hero__img"
      priority={priority}
      tone={toneFor(seed)}
    />
  );
}

export function SquareImage({
  seed,
  alt = "",
  className = "pimg",
  sizes = "(max-width:640px) 50vw, 16vw",
}: {
  seed: string;
  alt?: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <SmartImage
      src={fashionSrc(seed, 600, 600)}
      alt={alt}
      sizes={sizes}
      className={className}
      tone={toneFor(seed)}
    />
  );
}

export function BlogImage({ seed, alt = "" }: { seed: string; alt?: string }) {
  return (
    <SmartImage
      src={fashionSrc(seed, 800, 520)}
      alt={alt}
      sizes="(max-width:640px) 100vw, 33vw"
      className="blog-card__img"
      tone={toneFor(seed)}
    />
  );
}
