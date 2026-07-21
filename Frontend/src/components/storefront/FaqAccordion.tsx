"use client";

type FaqItem = { q: string; a: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="faq">
      {items.map((item, i) => (
        <details key={i} className="faq__item">
          <summary className="faq__q">
            {item.q}
            <span className="faq__icon" aria-hidden>+</span>
          </summary>
          <div className="faq__a">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
