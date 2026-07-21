"use client";

/**
 * Homepage sections (Home Luxe redesign): category tiles, new arrivals grid,
 * brand story banner with parallax, newsletter with animated success state.
 * Reuses: <Reveal/> (scroll reveals), <ProductImage/>/<HeroImage/> (imagery),
 * shop-data content, store-context wishlist, and the global .btn system.
 * Styling: .hl-* classes in src/styles/home-luxe.css — all theme-token driven.
 */
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Reveal } from "./Reveal";
import { HeroImage, ProductImage } from "./ProductImage";
import { formatPrice } from "./primitives";
import { CATEGORY_TILES, PRODUCTS, discountPct, type ShopProduct } from "@/lib/shop-data";
import { useStore } from "@/lib/store-context";

/* ------------------------------------------------------------ categories */

const CATEGORY_SEEDS = ["women-dress-editorial", "men-tailoring-portrait", "fashion-accessories-flatlay"];
const CATEGORY_TILTS = [-2.5, 1.8, -1.9];
const MARQUEE_WORDS = ["Evening", "Everyday", "Bridal", "Resort", "Pure Silk", "SS26"];

/** Infinite fashion ticker — two identical groups, CSS-translated by -50%. */
function CategoryMarquee() {
  return (
    <div className="hl-marquee" aria-hidden>
      <div className="hl-marquee__track">
        {[0, 1].map((d) => (
          <span key={d} className="hl-marquee__group">
            {MARQUEE_WORDS.map((w, i) => (
              <span key={w} className={`hl-marquee__word${i % 2 ? " hl-marquee__word--outline" : ""}`}>
                {w} <i>✦</i>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Category card: idle float + cursor tilt + slow crossfade between looks. */
function CategoryCard({
  title,
  count,
  href,
  seed,
  index,
}: {
  title: string;
  count: string;
  href: string;
  seed: string;
  index: number;
}) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 160, damping: 18 });
  const sry = useSpring(ry, { stiffness: 160, damping: 18 });
  const [frame, setFrame] = useState(0);

  const seeds = [seed, `${seed}-look-two`, `${seed}-look-three`];

  // Auto-cycle through looks, each card slightly out of phase
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % seeds.length), 3800 + index * 700);
    return () => clearInterval(id);
  }, [reduce, index, seeds.length]);

  return (
    <div
      className="hl-cat-float"
      style={{ "--float-delay": `${index * 1.3}s`, "--cat-tilt": `${CATEGORY_TILTS[index % 3]}deg` } as CSSProperties}
    >
      <motion.div
        style={reduce ? undefined : { rotateX: srx, rotateY: sry, transformPerspective: 900 }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
          rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8);
        }}
        onMouseLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
      >
        <Link href={href} className="hl-cat">
          {seeds.map((s, k) => (
            <span key={s} className={`hl-cat__frame${k === frame ? " is-active" : ""}`}>
              <ProductImage seed={s} alt={k === 0 ? title : ""} sizes="(max-width:640px) 100vw, 33vw" />
            </span>
          ))}
          <span className="hl-cat__dots" aria-hidden>
            {seeds.map((s, k) => (
              <i key={s} className={k === frame ? "is-active" : ""} />
            ))}
          </span>
          <span className="hl-cat__label">
            <span>
              <h3>{title}</h3>
              <span>{count}</span>
            </span>
            <svg className="hl-cat__arrow" width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>
      </motion.div>
    </div>
  );
}

export function HomeLuxeCategories() {
  return (
    <section className="section" id="collections">
      <div className="container">
        <Reveal>
          <div className="section-head section-head--row">
            <div>
              <p className="eyebrow">Collections</p>
              <h2 className="section-title">Three moods. One wardrobe.</h2>
            </div>
            <Link href="/shop" className="btn btn--outline">
              Browse everything
            </Link>
          </div>
        </Reveal>
      </div>

      <CategoryMarquee />

      <div className="container">
        <div className="hl-cats">
          {CATEGORY_TILES.map((c, i) => (
            <Reveal key={c.title} delay={i * 110}>
              <CategoryCard
                title={c.title}
                count={c.count}
                href={c.href}
                seed={CATEGORY_SEEDS[i % CATEGORY_SEEDS.length]}
                index={i}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- new arrivals */

function WishHeart({ product }: { product: ShopProduct }) {
  const { wishlist, toggleWishlist } = useStore();
  const on = wishlist.includes(product.id);
  return (
    <motion.button
      className={`hl-heart${on ? " is-on" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        toggleWishlist(product.id);
      }}
      whileTap={{ scale: 0.8 }}
      aria-label={on ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      aria-pressed={on}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={on ? "on" : "off"}
          width="18"
          height="18"
          viewBox="0 0 20 20"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          aria-hidden
        >
          <path
            d="M10 17.2S2.5 12.6 2.5 7.4A4.1 4.1 0 0110 5a4.1 4.1 0 017.5 2.4c0 5.2-7.5 9.8-7.5 9.8z"
            fill={on ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </motion.svg>
      </AnimatePresence>
    </motion.button>
  );
}

export function HomeLuxeArrivals() {
  const dresses = PRODUCTS.filter((p) => p.category === "Dresses");
  const rest = PRODUCTS.filter((p) => p.audience === "Women" && p.category !== "Dresses");
  const items = [...dresses, ...rest].slice(0, 8);

  return (
    <section className="section" id="new-arrivals">
      <div className="container">
        <Reveal>
          <div className="section-head section-head--row">
            <div>
              <p className="eyebrow">Just landed</p>
              <h2 className="section-title">New arrivals</h2>
            </div>
            <Link href="/shop" className="btn btn--outline">
              View all
            </Link>
          </div>
        </Reveal>

        <div className="hl-products">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 90}>
              <Link href={`/shop/${p.id}`} className="hl-card">
                <span className="hl-card__media">
                  <ProductImage seed={p.id} alt={p.name} tone={p.tone} />
                  <span className="pimg hl-card__img--alt" aria-hidden>
                    <ProductImage seed={`${p.id}-styled`} alt="" tone={p.tone} />
                  </span>
                  {discountPct(p) >= 25 && (
                    <span className="hl-card__badge">−{discountPct(p)}%</span>
                  )}
                  <WishHeart product={p} />
                </span>
                <span className="hl-card__info">
                  <span>
                    <h3>{p.name}</h3>
                    <small>{p.category}</small>
                  </span>
                  <span className="hl-price">
                    {formatPrice(p.price)}
                    {p.compareAtPrice > p.price && <s>{formatPrice(p.compareAtPrice)}</s>}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- story banner */

export function HomeLuxeStory() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section className="section" id="hl-story">
      <div className="container">
        <div className="hl-story" ref={ref}>
          <div className="hl-story__grid">
            <div className="hl-story__media">
              <motion.div style={reduce ? undefined : { y: parallaxY }}>
                <HeroImage seed="atelier-seamstress-studio" alt="Inside the atelier" />
              </motion.div>
            </div>
            <motion.div
              className="hl-story__body"
              initial={reduce ? undefined : { opacity: 0, x: 48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="eyebrow">Our story</p>
              <h2 className="section-title">Made slowly, worn endlessly.</h2>
              <blockquote>
                “A dress should feel like it was always yours — from the first
                fitting to the hundredth wear.”
              </blockquote>
              <p className="muted" style={{ marginBottom: "2.5rem" }}>
                Every piece begins as a single bolt of natural fabric in our
                atelier. We cut in small batches, finish every seam by hand, and
                never chase seasons — only silhouettes that last.
              </p>
              <div>
                <Link href="/shop" className="btn btn--primary">
                  Discover the collection
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- newsletter */

export function HomeLuxeNewsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setDone(true);
  };

  return (
    <section className="section section--tight">
      <div className="container">
        <Reveal>
          <div className="hl-news">
            <p className="eyebrow">Stay close</p>
            <h2 className="section-title">First looks, before anyone else.</h2>
            <p className="muted" style={{ maxWidth: "32rem", margin: "1rem auto 0" }}>
              One thoughtful email a month — new silhouettes, atelier notes, and
              early access. No noise.
            </p>

            <AnimatePresence mode="wait">
              {!done ? (
                <motion.form
                  key="form"
                  className="hl-news__form"
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                >
                  <input
                    className="hl-news__input"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Email address"
                  />
                  <button type="submit" className="btn btn--primary">
                    Subscribe
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="done"
                  className="hl-news__success"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18 }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
                    <motion.circle
                      cx="14"
                      cy="14"
                      r="12.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                    <motion.path
                      d="M8.5 14.4l3.6 3.6 7.4-8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
                    />
                  </svg>
                  You’re on the list. Welcome to the atelier.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
