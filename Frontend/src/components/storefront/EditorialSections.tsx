import Link from "next/link";
import Image from "next/image";
import { TRENDING_CARDS, BRAND_STORY, LOOKBOOK, SOCIAL_PROOF } from "@/lib/shop-data";
import { fashionSrc } from "@/lib/fashion-images";

/* --------------------------------------------------------- Trending cards */
export function TrendingCollection() {
  return (
    <div className="lux-trend">
      {TRENDING_CARDS.map((c) => (
        <Link key={c.title} href={c.href} className={`lux-trendcard lux-trendcard--${c.size}`}>
          <Image
            src={fashionSrc(c.seed, 900, 1100)}
            alt={c.title}
            fill
            sizes="(max-width:900px) 100vw, 40vw"
            className="lux-trendcard__img"
          />
          <span className="lux-trendcard__veil" aria-hidden />
          <span className="lux-trendcard__body">
            <span className="lux-trendcard__tag">{c.tag}</span>
            <span className="lux-trendcard__title">{c.title}</span>
            <span className="lux-trendcard__story">{c.story}</span>
            <span className="lux-trendcard__cta">Explore the story →</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ Brand story */
export function BrandStory() {
  const s = BRAND_STORY;
  return (
    <div className="lux-story">
      <div className="lux-story__head">
        <p className="lux-kicker">{s.kicker}</p>
        <h2 className="lux-h2">{s.heading}</h2>
        <p className="lux-story__intro">{s.intro}</p>
      </div>
      <ol className="lux-timeline">
        {s.milestones.map((m, i) => (
          <li key={m.year} className="lux-timeline__item">
            <span className="lux-timeline__node">{String(i + 1).padStart(2, "0")}</span>
            <div className="lux-timeline__content">
              <span className="lux-timeline__year">{m.year}</span>
              <h3 className="lux-timeline__title">{m.title}</h3>
              <p className="lux-timeline__text">{m.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* --------------------------------------------------------------- Lookbook */
export function Lookbook() {
  const l = LOOKBOOK;
  return (
    <div className="lux-lookbook" id="lookbook">
      <div className="lux-lookbook__head">
        <p className="lux-kicker">{l.kicker}</p>
        <h2 className="lux-h2">{l.heading}</h2>
      </div>
      <div className="lux-lookbook__grid">
        {l.frames.map((f, i) => (
          <Link key={f.title} href={f.href} className={`lux-frame lux-frame--${i}`}>
            <Image
              src={fashionSrc(f.seed, 900, 1200)}
              alt={f.title}
              fill
              sizes="(max-width:900px) 100vw, 33vw"
              className="lux-frame__img"
            />
            <span className="lux-frame__veil" aria-hidden />
            <span className="lux-frame__body">
              <span className="lux-frame__season">{f.season}</span>
              <span className="lux-frame__title">{f.title}</span>
              <span className="lux-frame__cta">View the edit →</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------- Social proof (UGC) */
export function SocialProof() {
  return (
    <div className="lux-proof">
      {SOCIAL_PROOF.map((p) => (
        <figure key={p.handle} className="lux-proofcard">
          <div className="lux-proofcard__media">
            <Image
              src={fashionSrc(p.seed, 500, 500)}
              alt={p.name}
              fill
              sizes="(max-width:640px) 50vw, 22vw"
              className="lux-proofcard__img"
            />
            <span className="lux-proofcard__verified" title="Verified purchase">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
          </div>
          <figcaption className="lux-proofcard__body">
            <span className="lux-proofcard__stars" aria-label={`${p.rating} out of 5`}>
              {"★".repeat(p.rating)}<span className="lux-proofcard__starsOff">{"★".repeat(5 - p.rating)}</span>
            </span>
            <p className="lux-proofcard__text">&ldquo;{p.text}&rdquo;</p>
            <span className="lux-proofcard__who">{p.name} <i>{p.handle}</i></span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
