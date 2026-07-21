"use client";

/**
 * ShopTheLookInteractive — a shoppable lifestyle image.
 *
 * Left:  a lifestyle photo with clickable "+" markers pinned to each garment.
 * Right: a product detail panel that updates when a marker (or chip) is picked.
 *
 * Two pieces of state:
 *   • activeId — which item the right-hand panel / chips reflect.
 *   • openId   — which item's full detail modal is open (null = closed).
 * Clicking a "+" marker selects the item AND opens its detail modal, so every
 * marker clearly drills into that particular dress. Chips just switch the panel;
 * the VIEW button (re)opens the modal for the active item.
 *
 * Styled with Tailwind in a warm cream / terracotta palette.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/* --------------------------------------------------------------- data model */

export type LookItem = {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  description: string;
  markerPosition: { x: number; y: number };
};

const U = (id: string, s = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${s}&h=${s}&fit=crop&auto=format&q=72`;

const items: LookItem[] = [
  { id: 1, name: "Modern White Suit", category: "SUIT", price: 90, originalPrice: 100, imageUrl: U("1594938298603-c8148c4dae35"), description: "A sharp, modern-cut suit in a breathable wool blend — tailored for confident, easy movement from desk to dinner.", markerPosition: { x: 58, y: 30 } },
  { id: 2, name: "Classic White Shirt", category: "SHIRT", price: 49, originalPrice: 60, imageUrl: U("1602810318383-e386cc2a3ccf"), description: "Crisp poplin shirt with a clean collar and mother-of-pearl buttons. The everyday essential under any tailoring.", markerPosition: { x: 42, y: 32 } },
  { id: 3, name: "Classy Light Coat", category: "COAT", price: 150, originalPrice: 180, imageUrl: U("1539533018447-63fcce2678e3"), description: "A lightweight, unstructured coat that layers effortlessly over tailoring or knitwear when the evening cools.", markerPosition: { x: 28, y: 56 } },
  { id: 4, name: "Leather Hand Bag", category: "BAG", price: 120, originalPrice: 140, imageUrl: U("1584917865442-de89df76afd3"), description: "Full-grain leather holdall with brushed hardware and a soft suede lining — roomy enough for the weekend.", markerPosition: { x: 54, y: 62 } },
  { id: 5, name: "Classic Gold Watch", category: "WATCH", price: 66, originalPrice: 80, imageUrl: U("1523275335684-37898b6baf30"), description: "A slim gold-tone dress watch on a tan leather strap. Quiet luxury that finishes the whole look.", markerPosition: { x: 72, y: 44 } },
];

const LOOK_IMAGE =
  "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1100&h=1100&fit=crop&auto=format&q=72";

const money = (n: number) => `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/* ------------------------------------------------------- ClothingItem marker */

type ClothingItemProps = LookItem & {
  isActive: boolean;
  onSelect: (id: number) => void;
};

function ClothingItem({ id, name, category, markerPosition, isActive, onSelect }: ClothingItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-label={`View ${name} (${category})`}
      aria-pressed={isActive}
      style={{ left: `${markerPosition.x}%`, top: `${markerPosition.y}%` }}
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 outline-none"
    >
      {!isActive && (
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-white/70" />
      )}
      <span
        className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#2E2017] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#FAF7F2] transition-opacity duration-200 ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {category}
      </span>
      <span
        className={`relative grid h-10 w-10 place-items-center rounded-full text-lg shadow-[0_6px_16px_rgba(46,32,23,0.28)] ring-1 transition-all duration-300 ${
          isActive
            ? "scale-110 bg-[#2E2017] text-[#FAF7F2] ring-[#2E2017]"
            : "bg-white/95 text-[#2E2017] ring-black/5 group-hover:scale-110 group-hover:bg-white"
        }`}
      >
        {isActive ? "×" : "+"}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------- detail modal */

function DetailModal({ item, onClose }: { item: LookItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const off = Math.round((1 - item.price / item.originalPrice) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} details`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E2017]/55 p-4 backdrop-blur-sm"
      style={{ animation: "stlFade 0.25s ease" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative grid w-full max-w-3xl overflow-hidden rounded-3xl bg-[#FAF7F2] text-[#2E2017] shadow-[0_40px_90px_rgba(46,32,23,0.4)] sm:grid-cols-2"
        style={{ animation: "stlPop 0.3s cubic-bezier(0.22,1,0.36,1)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg text-[#2E2017] shadow-md transition-transform hover:scale-110"
        >
          ×
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt={item.name} className="h-56 w-full object-cover sm:h-full" />

        <div className="flex flex-col p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C4704F]">{item.category}</p>
          <h3 className="mt-1 font-serif text-2xl leading-tight text-[#2E2017] sm:text-3xl">{item.name}</h3>

          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#2E2017]">{money(item.price)}</span>
            <span className="text-base text-[#A8998C] line-through">{money(item.originalPrice)}</span>
            <span className="rounded-full bg-[#F4E8DD] px-2 py-0.5 text-xs font-semibold text-[#C4704F]">{off}% off</span>
          </p>

          <p className="mt-4 text-sm leading-relaxed text-[#6F6155]">{item.description}</p>

          <div className="mt-auto flex flex-col gap-2.5 pt-6 sm:flex-row">
            <button
              type="button"
              className="flex-1 rounded-full bg-[#2E2017] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#FAF7F2] shadow-[0_10px_24px_rgba(46,32,23,0.3)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Add to cart · {money(item.price)}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#2E2017]/30 px-6 py-3 text-sm font-semibold text-[#2E2017] transition-colors hover:bg-[#2E2017]/5"
            >
              Keep browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- main view */

export function ShopTheLookInteractive() {
  const [activeId, setActiveId] = useState<number>(items[0].id);
  const [openId, setOpenId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = items.find((i) => i.id === activeId) ?? items[0];
  const openItem = openId == null ? null : items.find((i) => i.id === openId) ?? null;

  // Clicking a marker selects the item AND opens its detail.
  const selectAndOpen = (id: number) => {
    setActiveId(id);
    setOpenId(id);
  };

  const total = items.reduce((sum, i) => sum + i.price, 0);
  const discountPct = 15;
  const lookPrice = total * (1 - discountPct / 100);
  const savings = total - lookPrice;

  return (
    <section className="bg-[#FAF7F2] px-4 py-16 text-[#2E2017] sm:px-6 lg:py-24">
      <style>{`
        @keyframes stlFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes stlPop{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:none}}
      `}</style>

      <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-2 lg:gap-14">
        {/* ---------------------------------------------------------- left */}
        <div className="relative overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(46,32,23,0.16)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOOK_IMAGE}
            alt="Shop the look — styled rail"
            className="aspect-[4/5] w-full object-cover sm:aspect-square"
          />
          {items.map((it) => (
            <ClothingItem
              key={it.id}
              {...it}
              isActive={it.id === activeId}
              onSelect={selectAndOpen}
            />
          ))}
        </div>

        {/* --------------------------------------------------------- right */}
        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C4704F]">Shop the Look</p>
          <h2 className="mt-2 font-serif text-4xl leading-tight text-[#2E2017] sm:text-5xl">
            The Off-Duty Tailoring Story
          </h2>
          <p className="mt-3 text-[#7A6A5D]">Tap a marker to explore each piece, or take the whole look.</p>

          {/* detail card (crossfades on change) */}
          <div
            key={active.id}
            style={{ animation: "stlFade 0.35s ease" }}
            className="mt-7 flex items-center gap-4 rounded-2xl border border-[#E7D9CC] bg-white/70 p-3 pr-4 sm:p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.imageUrl} alt={active.name} className="h-20 w-20 flex-none rounded-xl object-cover sm:h-24 sm:w-24" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C4704F]">{active.category}</p>
              <h3 className="mt-0.5 truncate font-serif text-xl text-[#2E2017]">{active.name}</h3>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#2E2017]">{money(active.price)}</span>
                <span className="text-sm text-[#A8998C] line-through">{money(active.originalPrice)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenId(active.id)}
              className="flex-none rounded-full border border-[#2E2017] px-5 py-2 text-sm font-semibold tracking-wide text-[#2E2017] transition-colors duration-200 hover:bg-[#2E2017] hover:text-[#FAF7F2]"
            >
              VIEW
            </button>
          </div>

          {/* chips */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            {items.map((it) => {
              const on = it.id === activeId;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setActiveId(it.id)}
                  aria-pressed={on}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    on
                      ? "bg-[#2E2017] text-[#FAF7F2] shadow-[0_8px_18px_rgba(46,32,23,0.25)]"
                      : "border border-[#E0D2C4] bg-white/60 text-[#5C4D40] hover:border-[#2E2017] hover:text-[#2E2017]"
                  }`}
                >
                  {it.name}
                </button>
              );
            })}
          </div>

          {/* complete-look bottom bar */}
          <div className="mt-8 flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-[#E7D3C4] bg-[#F4E8DD] p-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-serif text-lg text-[#2E2017]">Buy the complete look</p>
              <p className="mt-0.5 text-sm font-semibold text-[#C4704F]">Save {discountPct}% · {money(savings)} off</p>
            </div>
            <button
              type="button"
              className="rounded-full bg-[#2E2017] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-[#FAF7F2] shadow-[0_10px_24px_rgba(46,32,23,0.3)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Add Look · {money(lookPrice)}
            </button>
          </div>
        </div>
      </div>

      {mounted && openItem &&
        createPortal(
          <DetailModal item={openItem} onClose={() => setOpenId(null)} />,
          document.body,
        )}
    </section>
  );
}
