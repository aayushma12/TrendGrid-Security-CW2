import type { ReactNode } from "react";
import {
  PatternBackground,
  type PatternConfig,
} from "./PatternBackground";
import {
  Button,
  ProductCard,
  SectionHeading,
  formatPrice,
  type CardBehaviour,
  type StoreProduct,
} from "./primitives";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SectionSettings = Record<string, unknown>;

export interface SectionData {
  id: string;
  type: string;
  isVisible?: boolean;
  mobileHidden?: boolean;
  tabletHidden?: boolean;
  desktopHidden?: boolean;
  anchorId?: string | null;
  customClasses?: string | null;
  settingsJson?: SectionSettings | null;
  blocks?: { id: string; type: string; contentJson?: Record<string, unknown> | null }[];
}

/** Everything a section needs from the page/theme to render itself. */
export interface SectionContext {
  products: StoreProduct[];
  behaviour: CardBehaviour;
  currency: string;
  defaultPattern: PatternConfig;
  entrance: string;
}

type SectionComponent = (props: {
  s: SectionData;
  ctx: SectionContext;
}) => ReactNode;

// ---------------------------------------------------------------------------
// Small helpers to read settings with fallbacks
// ---------------------------------------------------------------------------

function str(s: SectionSettings | null | undefined, key: string, fallback = ""): string {
  const v = s?.[key];
  return typeof v === "string" ? v : fallback;
}
function num(s: SectionSettings | null | undefined, key: string, fallback: number): number {
  const v = s?.[key];
  return typeof v === "number" ? v : fallback;
}
function arr<T = unknown>(s: SectionSettings | null | undefined, key: string): T[] {
  const v = s?.[key];
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Resolve a section's pattern: use per-section override or the theme default. */
function resolvePattern(s: SectionData, ctx: SectionContext): PatternConfig {
  const o = s.settingsJson?.["pattern"] as Partial<PatternConfig> | undefined;
  if (o && typeof o === "object") {
    return { ...ctx.defaultPattern, ...o };
  }
  return ctx.defaultPattern;
}

const Container = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={`ndh-container ${className ?? ""}`.trim()}>{children}</div>
);

// ---------------------------------------------------------------------------
// HERO sections
// ---------------------------------------------------------------------------

const HeroBanner: SectionComponent = ({ s, ctx }) => {
  const set = s.settingsJson;
  return (
    <PatternBackground config={resolvePattern(s, ctx)} className="ndh-section">
      <Container>
        <div style={{ textAlign: "center", maxWidth: "760px", marginInline: "auto" }}>
          <h1 style={{ fontSize: "var(--font-size-5xl)", fontWeight: "var(--font-weight-black)" }}>
            {str(set, "heading", "Your headline here")}
          </h1>
          {str(set, "subtext") && (
            <p className="ndh-muted" style={{ marginTop: "1rem", fontSize: "var(--font-size-xl)" }}>
              {str(set, "subtext")}
            </p>
          )}
          {str(set, "ctaText") && (
            <div style={{ marginTop: "1.5rem" }}>
              <Button href={str(set, "ctaLink", "#")}>{str(set, "ctaText")}</Button>
            </div>
          )}
        </div>
      </Container>
    </PatternBackground>
  );
};

const HeroSplit: SectionComponent = ({ s, ctx }) => {
  const set = s.settingsJson;
  return (
    <section className="ndh-section">
      <Container>
        <div
          style={{
            display: "grid",
            gap: "var(--grid-gap)",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: "var(--font-size-4xl)", fontWeight: "var(--font-weight-black)" }}>
              {str(set, "heading", "Split hero")}
            </h1>
            <p className="ndh-muted" style={{ marginTop: "1rem", fontSize: "var(--font-size-lg)" }}>
              {str(set, "subtext", "Pair a bold statement with a striking image.")}
            </p>
            {str(set, "ctaText") && (
              <div style={{ marginTop: "1.5rem" }}>
                <Button href={str(set, "ctaLink", "#")}>{str(set, "ctaText")}</Button>
              </div>
            )}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={str(set, "image", "https://placehold.co/800x600")}
            alt={str(set, "heading", "")}
            style={{ width: "100%", borderRadius: "var(--radius-image)", objectFit: "cover" }}
          />
        </div>
      </Container>
    </section>
  );
};

const HeroVideo: SectionComponent = ({ s }) => {
  const set = s.settingsJson;
  return (
    <section className="ndh-section" style={{ position: "relative", overflow: "hidden" }}>
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={str(set, "poster")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      >
        <source src={str(set, "videoUrl")} />
      </video>
      <div style={{ position: "absolute", inset: 0, background: "var(--color-overlay)" }} />
      <Container>
        <div style={{ position: "relative", textAlign: "center", color: "var(--color-text-inverse)", padding: "6rem 0" }}>
          <h1 style={{ fontSize: "var(--font-size-5xl)", fontWeight: "var(--font-weight-black)", color: "inherit" }}>
            {str(set, "heading", "Video hero")}
          </h1>
          {str(set, "ctaText") && (
            <div style={{ marginTop: "1.5rem" }}>
              <Button href={str(set, "ctaLink", "#")}>{str(set, "ctaText")}</Button>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};

const HeroSlideshow: SectionComponent = ({ s, ctx }) => {
  const slides = arr<Record<string, string>>(s.settingsJson, "slides");
  const list = slides.length ? slides : [{ heading: str(s.settingsJson, "heading", "Slideshow") }];
  return (
    <section className="ndh-section" style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", gap: "var(--grid-gap)", overflowX: "auto", scrollSnapType: "x mandatory" }}>
        {list.map((sl, i) => (
          <div
            key={i}
            data-entrance={ctx.entrance}
            style={{ minWidth: "100%", scrollSnapAlign: "start", textAlign: "center", padding: "4rem 1rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-lg)" }}
          >
            <h2 style={{ fontSize: "var(--font-size-4xl)", fontWeight: "var(--font-weight-bold)" }}>{sl.heading}</h2>
            {sl.subtext && <p className="ndh-muted" style={{ marginTop: "0.75rem" }}>{sl.subtext}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

const HeroParallax: SectionComponent = ({ s, ctx }) => {
  const set = s.settingsJson;
  return (
    <section
      className="ndh-section"
      style={{
        backgroundImage: `url(${str(set, "image", "https://placehold.co/1600x900")})`,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ background: "var(--color-overlay)", padding: "6rem 0", borderRadius: "var(--radius-lg)" }}>
        <Container>
          <div data-entrance={ctx.entrance} style={{ textAlign: "center", color: "var(--color-text-inverse)" }}>
            <h1 style={{ fontSize: "var(--font-size-5xl)", fontWeight: "var(--font-weight-black)", color: "inherit" }}>
              {str(set, "heading", "Parallax hero")}
            </h1>
          </div>
        </Container>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// PRODUCT sections
// ---------------------------------------------------------------------------

function pickProducts(s: SectionData, ctx: SectionContext): StoreProduct[] {
  const limit = num(s.settingsJson, "limit", 8);
  return ctx.products.slice(0, limit);
}

const ProductGrid: SectionComponent = ({ s, ctx }) => {
  const products = pickProducts(s, ctx);
  return (
    <section className="ndh-section">
      <Container>
        <SectionHeading title={str(s.settingsJson, "heading")} subtitle={str(s.settingsJson, "subtext")} />
        <div className="ndh-grid">
          {products.map((p, i) => (
            <div key={p.id} data-entrance={ctx.entrance} style={{ animationDelay: `calc(var(--animation-stagger) * ${i})` }}>
              <ProductCard product={p} behaviour={ctx.behaviour} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

const ProductCarousel: SectionComponent = ({ s, ctx }) => {
  const products = pickProducts(s, ctx);
  return (
    <section className="ndh-section">
      <Container>
        <SectionHeading title={str(s.settingsJson, "heading")} align="left" />
        <div style={{ display: "flex", gap: "var(--grid-gap)", overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: "0.5rem" }}>
          {products.map((p) => (
            <div key={p.id} style={{ minWidth: "240px", scrollSnapAlign: "start" }}>
              <ProductCard product={p} behaviour={ctx.behaviour} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

const ProductFeatured: SectionComponent = ({ s, ctx }) => {
  const p = pickProducts(s, ctx)[0];
  if (!p) return null;
  return (
    <section className="ndh-section">
      <Container>
        <div style={{ display: "grid", gap: "var(--grid-gap)", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.imageUrl ?? "https://placehold.co/800x800"} alt={p.title} style={{ width: "100%", borderRadius: "var(--radius-image)" }} />
          <div>
            <h2 style={{ fontSize: "var(--font-size-4xl)", fontWeight: "var(--font-weight-bold)" }}>{p.title}</h2>
            <p className="ndh-muted" style={{ marginTop: "0.75rem" }}>{p.shortDescription}</p>
            <div style={{ marginTop: "1rem", fontFamily: "var(--font-mono)", fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-weight-bold)" }}>
              {formatPrice(p.price, ctx.currency)}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <Button href={`/product/${p.slug}`}>Shop now</Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

const ProductComparisonTable: SectionComponent = ({ s, ctx }) => {
  const products = pickProducts(s, ctx).slice(0, 4);
  const rows = arr<string>(s.settingsJson, "features");
  return (
    <section className="ndh-section">
      <Container>
        <SectionHeading title={str(s.settingsJson, "heading", "Compare")} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-sm)" }}>
            <thead>
              <tr>
                <th />
                {products.map((p) => (
                  <th key={p.id} style={{ padding: "0.75rem", textAlign: "center" }}>{p.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="ndh-muted" style={{ padding: "0.75rem" }}>Price</td>
                {products.map((p) => (
                  <td key={p.id} style={{ padding: "0.75rem", textAlign: "center", fontFamily: "var(--font-mono)" }}>{formatPrice(p.price, ctx.currency)}</td>
                ))}
              </tr>
              {rows.map((r) => (
                <tr key={r} style={{ borderTop: "var(--border-width) var(--border-style) var(--color-border)" }}>
                  <td className="ndh-muted" style={{ padding: "0.75rem" }}>{r}</td>
                  {products.map((p) => (
                    <td key={p.id} style={{ padding: "0.75rem", textAlign: "center", color: "var(--color-success)" }}>✓</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
};

// ---------------------------------------------------------------------------
// COLLECTION / CATEGORY sections
// ---------------------------------------------------------------------------

const CollectionGrid: SectionComponent = ({ s, ctx }) => {
  const items = arr<Record<string, string>>(s.settingsJson, "collections");
  return (
    <section className="ndh-section">
      <Container>
        <SectionHeading title={str(s.settingsJson, "heading", "Collections")} />
        <div className="ndh-grid">
          {items.map((c, i) => (
            <a key={i} href={c.link ?? "#"} className="ndh-card" data-style={ctx.behaviour.cardStyle} data-hover={ctx.behaviour.cardHoverEffect} style={{ color: "inherit", textDecoration: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ndh-card__image" src={c.image ?? "https://placehold.co/600x400"} alt={c.name ?? ""} loading="lazy" />
              <h3 style={{ marginTop: "0.75rem", fontWeight: "var(--font-weight-semibold)" }}>{c.name}</h3>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
};

const CollectionList: SectionComponent = ({ s }) => {
  const items = arr<Record<string, string>>(s.settingsJson, "collections");
  return (
    <section className="ndh-section">
      <Container>
        <SectionHeading title={str(s.settingsJson, "heading", "Collections")} align="left" />
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.5rem" }}>
          {items.map((c, i) => (
            <li key={i} style={{ borderBottom: "var(--border-width) var(--border-style) var(--color-border)", padding: "0.75rem 0" }}>
              <a href={c.link ?? "#"} style={{ color: "var(--color-text)", textDecoration: "none", fontWeight: "var(--font-weight-medium)" }}>{c.name}</a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
};

const CategoryShowcase: SectionComponent = CollectionGrid;

// ---------------------------------------------------------------------------
// BANNER sections
// ---------------------------------------------------------------------------

const BannerImage: SectionComponent = ({ s }) => {
  const set = s.settingsJson;
  return (
    <section className="ndh-section">
      <Container>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={str(set, "image", "https://placehold.co/1600x500")} alt={str(set, "alt")} style={{ width: "100%", borderRadius: "var(--radius-lg)" }} />
      </Container>
    </section>
  );
};

const BannerText: SectionComponent = ({ s, ctx }) => (
  <PatternBackground config={resolvePattern(s, ctx)} className="ndh-section">
    <Container>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "var(--font-size-3xl)", fontWeight: "var(--font-weight-bold)" }}>{str(s.settingsJson, "heading", "Banner")}</h2>
        {str(s.settingsJson, "subtext") && <p className="ndh-muted" style={{ marginTop: "0.5rem" }}>{str(s.settingsJson, "subtext")}</p>}
      </div>
    </Container>
  </PatternBackground>
);

const BannerCta: SectionComponent = ({ s, ctx }) => (
  <PatternBackground config={resolvePattern(s, ctx)} className="ndh-section">
    <Container>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-weight-bold)" }}>{str(s.settingsJson, "heading", "Call to action")}</h2>
          {str(s.settingsJson, "subtext") && <p className="ndh-muted" style={{ marginTop: "0.25rem" }}>{str(s.settingsJson, "subtext")}</p>}
        </div>
        <Button href={str(s.settingsJson, "ctaLink", "#")}>{str(s.settingsJson, "ctaText", "Get started")}</Button>
      </div>
    </Container>
  </PatternBackground>
);

const AnnouncementBar: SectionComponent = ({ s }) => (
  <div style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", textAlign: "center", padding: "0.6rem 1rem", fontSize: "var(--font-size-sm)" }}>
    {str(s.settingsJson, "text", "Free shipping on orders over $50")}
  </div>
);

// ---------------------------------------------------------------------------
// TESTIMONIALS / REVIEWS / TRUST
// ---------------------------------------------------------------------------

function testimonialList(s: SectionData) {
  return arr<Record<string, string>>(s.settingsJson, "items");
}

const TestimonialsGrid: SectionComponent = ({ s, ctx }) => (
  <section className="ndh-section">
    <Container>
      <SectionHeading title={str(s.settingsJson, "heading", "What customers say")} />
      <div className="ndh-grid">
        {testimonialList(s).map((t, i) => (
          <figure key={i} className="ndh-card" data-style={ctx.behaviour.cardStyle} style={{ margin: 0 }}>
            <blockquote style={{ margin: 0, fontStyle: "italic" }}>“{t.quote}”</blockquote>
            <figcaption className="ndh-muted" style={{ marginTop: "0.75rem", fontWeight: "var(--font-weight-semibold)" }}>— {t.author}</figcaption>
          </figure>
        ))}
      </div>
    </Container>
  </section>
);

const TestimonialsCarousel: SectionComponent = ({ s, ctx }) => (
  <section className="ndh-section">
    <Container>
      <SectionHeading title={str(s.settingsJson, "heading", "Testimonials")} />
      <div style={{ display: "flex", gap: "var(--grid-gap)", overflowX: "auto", scrollSnapType: "x mandatory" }}>
        {testimonialList(s).map((t, i) => (
          <figure key={i} className="ndh-card" data-style={ctx.behaviour.cardStyle} style={{ minWidth: "320px", scrollSnapAlign: "start", margin: 0 }}>
            <blockquote style={{ margin: 0, fontStyle: "italic" }}>“{t.quote}”</blockquote>
            <figcaption className="ndh-muted" style={{ marginTop: "0.75rem" }}>— {t.author}</figcaption>
          </figure>
        ))}
      </div>
    </Container>
  </section>
);

const TestimonialsMasonry: SectionComponent = ({ s, ctx }) => (
  <section className="ndh-section">
    <Container>
      <SectionHeading title={str(s.settingsJson, "heading", "Testimonials")} />
      <div style={{ columnGap: "var(--grid-gap)", columnCount: 3 }}>
        {testimonialList(s).map((t, i) => (
          <figure key={i} className="ndh-card" data-style={ctx.behaviour.cardStyle} style={{ breakInside: "avoid", marginBottom: "var(--grid-gap)" }}>
            <blockquote style={{ margin: 0, fontStyle: "italic" }}>“{t.quote}”</blockquote>
            <figcaption className="ndh-muted" style={{ marginTop: "0.5rem" }}>— {t.author}</figcaption>
          </figure>
        ))}
      </div>
    </Container>
  </section>
);

const ReviewsSummary: SectionComponent = ({ s }) => {
  const avg = num(s.settingsJson, "average", 4.8);
  const count = num(s.settingsJson, "count", 1280);
  return (
    <section className="ndh-section">
      <Container>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "var(--font-size-5xl)", fontWeight: "var(--font-weight-black)", color: "var(--color-accent)" }}>{avg.toFixed(1)}</div>
          <div className="ndh-muted">Based on {count.toLocaleString()} reviews</div>
        </div>
      </Container>
    </section>
  );
};

const TrustBadges: SectionComponent = ({ s }) => {
  const badges = arr<Record<string, string>>(s.settingsJson, "badges");
  const list = badges.length ? badges : [
    { title: "Free shipping" }, { title: "30-day returns" }, { title: "Secure checkout" }, { title: "24/7 support" },
  ];
  return (
    <section className="ndh-section">
      <Container>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--grid-gap)", textAlign: "center" }}>
          {list.map((b, i) => (
            <div key={i}>
              <div style={{ fontSize: "var(--font-size-2xl)" }}>{b.icon ?? "✓"}</div>
              <div style={{ marginTop: "0.5rem", fontWeight: "var(--font-weight-medium)" }}>{b.title}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

const BrandLogosStrip: SectionComponent = ({ s }) => {
  const logos = arr<string>(s.settingsJson, "logos");
  return (
    <section className="ndh-section">
      <Container>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "center", justifyContent: "center", opacity: 0.7 }}>
          {logos.map((l, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={l} alt="brand" style={{ height: "32px" }} />
          ))}
        </div>
      </Container>
    </section>
  );
};

const StatsCounter: SectionComponent = ({ s }) => {
  const stats = arr<Record<string, string>>(s.settingsJson, "stats");
  return (
    <section className="ndh-section">
      <Container>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--grid-gap)", textAlign: "center" }}>
          {stats.map((st, i) => (
            <div key={i}>
              <div style={{ fontSize: "var(--font-size-4xl)", fontWeight: "var(--font-weight-black)", color: "var(--color-primary)" }}>{st.value}</div>
              <div className="ndh-muted" style={{ marginTop: "0.25rem" }}>{st.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

// ---------------------------------------------------------------------------
// MARKETING / COMMERCE utilities
// ---------------------------------------------------------------------------

const NewsletterSignup: SectionComponent = ({ s, ctx }) => (
  <PatternBackground config={resolvePattern(s, ctx)} className="ndh-section">
    <Container>
      <div style={{ maxWidth: "520px", marginInline: "auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-weight-bold)" }}>{str(s.settingsJson, "heading", "Join our newsletter")}</h2>
        <p className="ndh-muted" style={{ marginTop: "0.5rem" }}>{str(s.settingsJson, "subtext", "Get the latest drops and offers.")}</p>
        <form style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <input className="ndh-input" type="email" placeholder="you@example.com" />
          <Button>{str(s.settingsJson, "ctaText", "Subscribe")}</Button>
        </form>
      </div>
    </Container>
  </PatternBackground>
);

const CountdownTimer: SectionComponent = ({ s }) => (
  <section className="ndh-section">
    <Container>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-weight-bold)" }}>{str(s.settingsJson, "heading", "Sale ends soon")}</h2>
        <div data-countdown={str(s.settingsJson, "endsAt")} style={{ marginTop: "1rem", fontFamily: "var(--font-mono)", fontSize: "var(--font-size-4xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>
          {str(s.settingsJson, "display", "00 : 00 : 00")}
        </div>
      </div>
    </Container>
  </section>
);

const ImageTextSplit: SectionComponent = ({ s }) => {
  const set = s.settingsJson;
  const reverse = str(set, "imageSide") === "right";
  return (
    <section className="ndh-section">
      <Container>
        <div style={{ display: "grid", gap: "var(--grid-gap)", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", alignItems: "center", direction: reverse ? "rtl" : "ltr" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={str(set, "image", "https://placehold.co/700x500")} alt={str(set, "heading", "")} style={{ width: "100%", borderRadius: "var(--radius-image)", direction: "ltr" }} />
          <div style={{ direction: "ltr" }}>
            <h2 style={{ fontSize: "var(--font-size-3xl)", fontWeight: "var(--font-weight-bold)" }}>{str(set, "heading", "Tell your story")}</h2>
            <p className="ndh-muted" style={{ marginTop: "0.75rem" }}>{str(set, "body")}</p>
            {str(set, "ctaText") && <div style={{ marginTop: "1rem" }}><Button href={str(set, "ctaLink", "#")}>{str(set, "ctaText")}</Button></div>}
          </div>
        </div>
      </Container>
    </section>
  );
};

const ImageTextOverlap: SectionComponent = ({ s }) => {
  const set = s.settingsJson;
  return (
    <section className="ndh-section">
      <Container>
        <div style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={str(set, "image", "https://placehold.co/1400x600")} alt="" style={{ width: "100%", borderRadius: "var(--radius-lg)" }} />
          <div className="ndh-card" data-style="elevated" style={{ position: "absolute", bottom: "-1.5rem", left: "1.5rem", maxWidth: "420px" }}>
            <h2 style={{ fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-weight-bold)" }}>{str(set, "heading", "Overlap")}</h2>
            <p className="ndh-muted" style={{ marginTop: "0.5rem" }}>{str(set, "body")}</p>
          </div>
        </div>
      </Container>
    </section>
  );
};

const ImageGalleryGrid: SectionComponent = ({ s }) => {
  const images = arr<string>(s.settingsJson, "images");
  return (
    <section className="ndh-section">
      <Container>
        <SectionHeading title={str(s.settingsJson, "heading")} />
        <div className="ndh-grid">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: "var(--radius-image)" }} />
          ))}
        </div>
      </Container>
    </section>
  );
};

const ImageGalleryMasonry: SectionComponent = ({ s }) => {
  const images = arr<string>(s.settingsJson, "images");
  return (
    <section className="ndh-section">
      <Container>
        <SectionHeading title={str(s.settingsJson, "heading")} />
        <div style={{ columnCount: 3, columnGap: "var(--grid-gap)" }}>
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img} alt="" loading="lazy" style={{ width: "100%", marginBottom: "var(--grid-gap)", borderRadius: "var(--radius-image)", breakInside: "avoid" }} />
          ))}
        </div>
      </Container>
    </section>
  );
};

const VideoEmbed: SectionComponent = ({ s }) => (
  <section className="ndh-section">
    <Container>
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <iframe
          src={str(s.settingsJson, "embedUrl")}
          title={str(s.settingsJson, "heading", "Video")}
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    </Container>
  </section>
);

const VideoBackground: SectionComponent = HeroVideo;

const RichText: SectionComponent = ({ s }) => (
  <section className="ndh-section">
    <Container>
      <div
        style={{ maxWidth: "720px", marginInline: "auto", lineHeight: "var(--line-height-relaxed)" }}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: str(s.settingsJson, "html", "<p>Rich text content.</p>") }}
      />
    </Container>
  </section>
);

const FaqAccordion: SectionComponent = ({ s }) => {
  const faqs = arr<Record<string, string>>(s.settingsJson, "items");
  return (
    <section className="ndh-section">
      <Container>
        <SectionHeading title={str(s.settingsJson, "heading", "FAQ")} />
        <div style={{ maxWidth: "720px", marginInline: "auto" }}>
          {faqs.map((f, i) => (
            <details key={i} className="ndh-card" data-style="outlined" style={{ marginBottom: "0.75rem" }}>
              <summary style={{ cursor: "pointer", fontWeight: "var(--font-weight-semibold)" }}>{f.q}</summary>
              <p className="ndh-muted" style={{ marginTop: "0.5rem" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
};

const PricingTable: SectionComponent = ({ s, ctx }) => {
  const plans = arr<Record<string, unknown>>(s.settingsJson, "plans");
  return (
    <section className="ndh-section">
      <Container>
        <SectionHeading title={str(s.settingsJson, "heading", "Pricing")} />
        <div className="ndh-grid">
          {plans.map((p, i) => (
            <div key={i} className="ndh-card" data-style={ctx.behaviour.cardStyle} data-hover={ctx.behaviour.cardHoverEffect} style={{ textAlign: "center" }}>
              <h3 style={{ fontWeight: "var(--font-weight-bold)" }}>{String(p.name ?? "")}</h3>
              <div style={{ fontSize: "var(--font-size-4xl)", fontWeight: "var(--font-weight-black)", color: "var(--color-primary)", margin: "0.5rem 0" }}>{String(p.price ?? "")}</div>
              <ul style={{ listStyle: "none", padding: 0, color: "var(--color-text-muted)", display: "grid", gap: "0.35rem" }}>
                {(Array.isArray(p.features) ? (p.features as string[]) : []).map((f, j) => (
                  <li key={j}>{f}</li>
                ))}
              </ul>
              <div style={{ marginTop: "1rem" }}><Button>{String(p.cta ?? "Choose")}</Button></div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

const ComparisonChart: SectionComponent = ProductComparisonTable;

const TeamGrid: SectionComponent = ({ s, ctx }) => {
  const team = arr<Record<string, string>>(s.settingsJson, "members");
  return (
    <section className="ndh-section">
      <Container>
        <SectionHeading title={str(s.settingsJson, "heading", "Our team")} />
        <div className="ndh-grid">
          {team.map((m, i) => (
            <div key={i} className="ndh-card" data-style={ctx.behaviour.cardStyle} style={{ textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.photo ?? "https://placehold.co/300x300"} alt={m.name} style={{ width: "96px", height: "96px", borderRadius: "var(--radius-full)", objectFit: "cover", marginInline: "auto" }} />
              <h3 style={{ marginTop: "0.75rem", fontWeight: "var(--font-weight-semibold)" }}>{m.name}</h3>
              <div className="ndh-muted">{m.role}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

const Timeline: SectionComponent = ({ s }) => {
  const events = arr<Record<string, string>>(s.settingsJson, "events");
  return (
    <section className="ndh-section">
      <Container>
        <SectionHeading title={str(s.settingsJson, "heading", "Timeline")} />
        <div style={{ maxWidth: "640px", marginInline: "auto", borderLeft: "2px solid var(--color-border)", paddingLeft: "1.5rem" }}>
          {events.map((e, i) => (
            <div key={i} style={{ marginBottom: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "-1.95rem", top: "0.2rem", width: "12px", height: "12px", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-primary)" }} />
              <div style={{ fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>{e.date}</div>
              <div style={{ fontWeight: "var(--font-weight-semibold)" }}>{e.title}</div>
              <p className="ndh-muted" style={{ marginTop: "0.25rem" }}>{e.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

const MapEmbed: SectionComponent = ({ s }) => (
  <section className="ndh-section">
    <Container>
      <iframe
        title="map"
        src={str(s.settingsJson, "embedUrl")}
        style={{ width: "100%", height: "400px", border: 0, borderRadius: "var(--radius-lg)" }}
        loading="lazy"
      />
    </Container>
  </section>
);

const ContactForm: SectionComponent = ({ s }) => (
  <section className="ndh-section">
    <Container>
      <div style={{ maxWidth: "560px", marginInline: "auto" }}>
        <SectionHeading title={str(s.settingsJson, "heading", "Get in touch")} />
        <form style={{ display: "grid", gap: "0.75rem" }}>
          <input className="ndh-input" placeholder="Your name" />
          <input className="ndh-input" type="email" placeholder="Email" />
          <textarea className="ndh-input" rows={4} placeholder="Message" />
          <Button>{str(s.settingsJson, "ctaText", "Send message")}</Button>
        </form>
      </div>
    </Container>
  </section>
);

const CustomHtml: SectionComponent = ({ s }) => (
  <section className="ndh-section">
    <Container>
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: str(s.settingsJson, "html", "") }} />
    </Container>
  </section>
);

const Divider: SectionComponent = () => (
  <Container>
    <hr style={{ border: 0, borderTop: "var(--border-width) var(--border-style) var(--color-border)", margin: "2rem 0" }} />
  </Container>
);

const Spacer: SectionComponent = ({ s }) => (
  <div style={{ height: str(s.settingsJson, "height", "3rem") }} />
);

const CookieBanner: SectionComponent = ({ s }) => (
  <div className="ndh-card" data-style="elevated" style={{ position: "fixed", bottom: "1rem", left: "1rem", right: "1rem", maxWidth: "520px", marginInline: "auto", zIndex: 50, display: "flex", gap: "1rem", alignItems: "center" }}>
    <span style={{ fontSize: "var(--font-size-sm)" }}>{str(s.settingsJson, "text", "We use cookies to improve your experience.")}</span>
    <Button>{str(s.settingsJson, "ctaText", "Accept")}</Button>
  </div>
);

const FloatingCartPreview: SectionComponent = ({ s }) => (
  <div className="ndh-card" data-style="elevated" style={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 50, display: "flex", gap: "0.75rem", alignItems: "center" }}>
    <span>🛍️</span>
    <span style={{ fontWeight: "var(--font-weight-semibold)" }}>{str(s.settingsJson, "label", "Cart")}</span>
    <span className="ndh-badge">{num(s.settingsJson, "count", 0)}</span>
  </div>
);

// ---------------------------------------------------------------------------
// FASHION / CLOTHING sections — every text + image is a settingsJson field,
// fully editable from the admin Page Builder.
// ---------------------------------------------------------------------------

/** Hero: badge + headline + copy + CTA on the left, model image on the right. */
const FashionHero: SectionComponent = ({ s }) => {
  const set = s.settingsJson;
  return (
    <section className="ndh-section ndhf-hero">
      <Container>
        <div className="ndhf-hero__grid">
          <div className="ndhf-hero__copy">
            {str(set, "badge") && (
              <span className="ndhf-pill">
                <span className="ndhf-pill__dot">%</span> {str(set, "badge")}
              </span>
            )}
            <h1 className="ndhf-hero__title">{str(set, "heading", "Step into Style: Your Ultimate Fashion Destination")}</h1>
            {str(set, "subtext") && <p className="ndh-muted ndhf-hero__sub">{str(set, "subtext")}</p>}
            {str(set, "ctaText") && (
              <div style={{ marginTop: "1.75rem" }}>
                <Button href={str(set, "ctaLink", "?page=shop")}>{str(set, "ctaText")} →</Button>
              </div>
            )}
          </div>
          <div className="ndhf-hero__media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={str(set, "image", "https://placehold.co/720x860")} alt={str(set, "imageAlt", str(set, "heading", "Fashion hero"))} />
            {str(set, "sticker") && (
              <span className="ndhf-sticker" aria-hidden>
                {str(set, "sticker")}
              </span>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};

/** Row of icon + title + text features (free shipping / payment / support). */
const FeaturesRow: SectionComponent = ({ s }) => {
  const items = arr<Record<string, string>>(s.settingsJson, "items");
  const list = items.length
    ? items
    : [
        { icon: "📦", title: "Free Shipping", text: "Free shipping for orders above $180" },
        { icon: "💳", title: "Flexible Payment", text: "Multiple secure payment options" },
        { icon: "🎧", title: "24x7 Support", text: "We support online all days" },
      ];
  return (
    <section className="ndhf-features">
      <Container>
        <div className="ndhf-features__grid">
          {list.map((f, i) => (
            <div className="ndhf-feature" key={i}>
              <span className="ndhf-feature__icon" aria-hidden>{f.icon ?? "✦"}</span>
              <div>
                <div className="ndhf-feature__title">{f.title}</div>
                <div className="ndh-muted ndhf-feature__text">{f.text}</div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

/** Category cards: count badge, title, description lines, image, link. */
const FashionCategories: SectionComponent = ({ s }) => {
  const items = arr<Record<string, unknown>>(s.settingsJson, "items");
  return (
    <section className="ndh-section">
      <Container>
        {str(s.settingsJson, "heading") && (
          <SectionHeading title={str(s.settingsJson, "heading")} subtitle={str(s.settingsJson, "subtext")} />
        )}
        <div className="ndhf-cats">
          {items.map((c, i) => {
            const lines = Array.isArray(c.lines) ? (c.lines as string[]) : [];
            return (
              <a key={i} className="ndhf-cat" href={typeof c.link === "string" ? c.link : "#"}>
                <div className="ndhf-cat__body">
                  {typeof c.badge === "string" && c.badge && <span className="ndhf-cat__badge">{c.badge}</span>}
                  <h3 className="ndhf-cat__title">{typeof c.title === "string" ? c.title : ""}</h3>
                  {typeof c.text === "string" && c.text && <p className="ndh-muted ndhf-cat__text">{c.text}</p>}
                  {lines.length > 0 && (
                    <ul className="ndhf-cat__lines">
                      {lines.map((l, j) => (
                        <li key={j}>{l}</li>
                      ))}
                    </ul>
                  )}
                  <span className="ndhf-cat__arrow" aria-hidden>→</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="ndhf-cat__img" src={typeof c.image === "string" ? c.image : "https://placehold.co/520x620"} alt={typeof c.title === "string" ? c.title : ""} loading="lazy" />
              </a>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

/** Promo banner: image beside kicker/heading/body/CTA on a tinted panel. */
const PromoBanner: SectionComponent = ({ s }) => {
  const set = s.settingsJson;
  const reverse = str(set, "imageSide", "left") === "right";
  return (
    <section className="ndh-section">
      <Container>
        <div className={`ndhf-promo${reverse ? " ndhf-promo--reverse" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ndhf-promo__img" src={str(set, "image", "https://placehold.co/640x520")} alt={str(set, "imageAlt", str(set, "heading", "Promotion"))} loading="lazy" />
          <div className="ndhf-promo__body">
            {str(set, "kicker") && <div className="ndhf-kicker">{str(set, "kicker")}</div>}
            <h2 className="ndhf-promo__title">{str(set, "heading", "25% Off All Fashion Favorites — Limited Time!")}</h2>
            {str(set, "body") && <p className="ndh-muted" style={{ marginTop: "0.75rem" }}>{str(set, "body")}</p>}
            {str(set, "ctaText") && (
              <div style={{ marginTop: "1.5rem" }}>
                <Button href={str(set, "ctaLink", "?page=shop")}>{str(set, "ctaText")}</Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};

/** Deal of the Day: heading + intro beside a row of sale product cards. */
const DealsOfDay: SectionComponent = ({ s, ctx }) => {
  const limit = num(s.settingsJson, "limit", 4);
  const sale = ctx.products.filter((p) => p.compareAtPrice != null && p.price != null && p.compareAtPrice > p.price);
  const products = (sale.length ? sale : ctx.products).slice(0, limit);
  return (
    <section className="ndh-section">
      <Container>
        <div className="ndhf-deals__head">
          <div>
            {str(s.settingsJson, "kicker") && <div className="ndhf-kicker">{str(s.settingsJson, "kicker")}</div>}
            <h2 className="ndhf-h2">{str(s.settingsJson, "heading", "Deal of the Day")}</h2>
          </div>
          {str(s.settingsJson, "subtext") && (
            <p className="ndh-muted ndhf-deals__sub">{str(s.settingsJson, "subtext")}</p>
          )}
        </div>
        <div className="ndh-grid" style={{ marginTop: "1.5rem" }}>
          {products.map((p, i) => (
            <div key={p.id} data-entrance={ctx.entrance} style={{ animationDelay: `calc(var(--animation-stagger) * ${i})` }}>
              <ProductCard product={p} behaviour={ctx.behaviour} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

/** Top sellers: kicker + heading + category filter tabs + product grid. */
const TopSellers: SectionComponent = ({ s, ctx }) => {
  const limit = num(s.settingsJson, "limit", 8);
  return (
    <section className="ndh-section">
      <Container>
        <div className="ndhf-deals__head">
          <div>
            {str(s.settingsJson, "kicker") && <div className="ndhf-kicker">{str(s.settingsJson, "kicker")}</div>}
            <h2 className="ndhf-h2">{str(s.settingsJson, "heading", "Our Top Seller Products")}</h2>
          </div>
        </div>
        <div className="ndh-grid">
          {ctx.products.slice(0, limit).map((p, i) => (
            <div key={p.id} data-entrance={ctx.entrance} style={{ animationDelay: `calc(var(--animation-stagger) * ${i})` }}>
              <ProductCard product={p} behaviour={ctx.behaviour} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

// ---------------------------------------------------------------------------
// REGISTRY — maps every SectionType to its component
// ---------------------------------------------------------------------------

export const SECTION_REGISTRY: Record<string, SectionComponent> = {
  fashion_hero: FashionHero,
  features_row: FeaturesRow,
  fashion_categories: FashionCategories,
  promo_banner: PromoBanner,
  deals_of_day: DealsOfDay,
  top_sellers: TopSellers,
  hero_banner: HeroBanner,
  hero_split: HeroSplit,
  hero_video: HeroVideo,
  hero_slideshow: HeroSlideshow,
  hero_parallax: HeroParallax,
  product_grid: ProductGrid,
  product_carousel: ProductCarousel,
  product_featured: ProductFeatured,
  product_comparison_table: ProductComparisonTable,
  collection_grid: CollectionGrid,
  collection_list: CollectionList,
  category_showcase: CategoryShowcase,
  banner_image: BannerImage,
  banner_text: BannerText,
  banner_cta: BannerCta,
  testimonials_grid: TestimonialsGrid,
  testimonials_carousel: TestimonialsCarousel,
  testimonials_masonry: TestimonialsMasonry,
  reviews_summary: ReviewsSummary,
  trust_badges: TrustBadges,
  brand_logos_strip: BrandLogosStrip,
  stats_counter: StatsCounter,
  newsletter_signup: NewsletterSignup,
  countdown_timer: CountdownTimer,
  image_text_split: ImageTextSplit,
  image_text_overlap: ImageTextOverlap,
  image_gallery_grid: ImageGalleryGrid,
  image_gallery_masonry: ImageGalleryMasonry,
  video_embed: VideoEmbed,
  video_background: VideoBackground,
  rich_text: RichText,
  faq_accordion: FaqAccordion,
  pricing_table: PricingTable,
  comparison_chart: ComparisonChart,
  team_grid: TeamGrid,
  timeline: Timeline,
  map_embed: MapEmbed,
  contact_form: ContactForm,
  custom_html: CustomHtml,
  divider: Divider,
  spacer: Spacer,
  announcement_bar: AnnouncementBar,
  cookie_banner: CookieBanner,
  floating_cart_preview: FloatingCartPreview,
};

/** Human-readable labels + category for the admin section library. */
export const SECTION_CATALOG: { type: string; label: string; group: string }[] = [
  { type: "fashion_hero", label: "Fashion Hero", group: "Fashion" },
  { type: "features_row", label: "Features Row", group: "Fashion" },
  { type: "fashion_categories", label: "Category Cards", group: "Fashion" },
  { type: "promo_banner", label: "Promo Banner", group: "Fashion" },
  { type: "deals_of_day", label: "Deal of the Day", group: "Fashion" },
  { type: "top_sellers", label: "Top Sellers (Tabs)", group: "Fashion" },
  { type: "hero_banner", label: "Hero Banner", group: "Layout" },
  { type: "hero_split", label: "Hero Split", group: "Layout" },
  { type: "hero_video", label: "Hero Video", group: "Layout" },
  { type: "hero_slideshow", label: "Hero Slideshow", group: "Layout" },
  { type: "hero_parallax", label: "Hero Parallax", group: "Layout" },
  { type: "product_grid", label: "Product Grid", group: "Product" },
  { type: "product_carousel", label: "Product Carousel", group: "Product" },
  { type: "product_featured", label: "Featured Product", group: "Product" },
  { type: "product_comparison_table", label: "Comparison Table", group: "Product" },
  { type: "collection_grid", label: "Collection Grid", group: "Product" },
  { type: "collection_list", label: "Collection List", group: "Product" },
  { type: "category_showcase", label: "Category Showcase", group: "Product" },
  { type: "banner_image", label: "Image Banner", group: "Marketing" },
  { type: "banner_text", label: "Text Banner", group: "Marketing" },
  { type: "banner_cta", label: "CTA Banner", group: "Marketing" },
  { type: "testimonials_grid", label: "Testimonials Grid", group: "Marketing" },
  { type: "testimonials_carousel", label: "Testimonials Carousel", group: "Marketing" },
  { type: "testimonials_masonry", label: "Testimonials Masonry", group: "Marketing" },
  { type: "reviews_summary", label: "Reviews Summary", group: "Marketing" },
  { type: "trust_badges", label: "Trust Badges", group: "Commerce" },
  { type: "brand_logos_strip", label: "Brand Logos", group: "Marketing" },
  { type: "stats_counter", label: "Stats Counter", group: "Marketing" },
  { type: "newsletter_signup", label: "Newsletter", group: "Commerce" },
  { type: "countdown_timer", label: "Countdown Timer", group: "Commerce" },
  { type: "image_text_split", label: "Image + Text", group: "Content" },
  { type: "image_text_overlap", label: "Image + Text Overlap", group: "Content" },
  { type: "image_gallery_grid", label: "Gallery Grid", group: "Content" },
  { type: "image_gallery_masonry", label: "Gallery Masonry", group: "Content" },
  { type: "video_embed", label: "Video Embed", group: "Content" },
  { type: "video_background", label: "Video Background", group: "Content" },
  { type: "rich_text", label: "Rich Text", group: "Content" },
  { type: "faq_accordion", label: "FAQ Accordion", group: "Content" },
  { type: "pricing_table", label: "Pricing Table", group: "Marketing" },
  { type: "comparison_chart", label: "Comparison Chart", group: "Product" },
  { type: "team_grid", label: "Team Grid", group: "Content" },
  { type: "timeline", label: "Timeline", group: "Content" },
  { type: "map_embed", label: "Map", group: "Advanced" },
  { type: "contact_form", label: "Contact Form", group: "Advanced" },
  { type: "custom_html", label: "Custom HTML", group: "Advanced" },
  { type: "divider", label: "Divider", group: "Layout" },
  { type: "spacer", label: "Spacer", group: "Layout" },
  { type: "announcement_bar", label: "Announcement Bar", group: "Marketing" },
  { type: "cookie_banner", label: "Cookie Banner", group: "Advanced" },
  { type: "floating_cart_preview", label: "Floating Cart", group: "Commerce" },
];
