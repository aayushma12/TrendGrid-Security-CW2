"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store-context";

const ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/shop", label: "Shop", icon: "grid" },
  { href: "/account/wishlist", label: "Wishlist", icon: "heart" },
  { href: "/cart", label: "Cart", icon: "bag" },
  { href: "/profile", label: "Account", icon: "user" },
];

function Icon({ name }: { name: string }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "home": return (<svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>);
    case "grid": return (<svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>);
    case "heart": return (<svg {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>);
    case "bag": return (<svg {...p}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>);
    default: return (<svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
  }
}

export function MobileNav({ cartCount }: { cartCount?: number }) {
  const { count } = useStore();
  const displayCount = cartCount ?? count;
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="lux-bottomnav" aria-label="Mobile navigation">
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`lux-bottomnav__item${isActive(it.href) ? " is-active" : ""}`}
          aria-current={isActive(it.href) ? "page" : undefined}
        >
          <span className="lux-bottomnav__icon">
            <Icon name={it.icon} />
            {it.icon === "bag" && displayCount > 0 && (
              <span className="lux-bottomnav__badge">{displayCount}</span>
            )}
          </span>
          <span className="lux-bottomnav__label">{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
