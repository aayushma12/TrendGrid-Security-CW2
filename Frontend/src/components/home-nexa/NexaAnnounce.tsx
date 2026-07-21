"use client";

import { useState } from "react";
import { STORE } from "@/lib/shop-data";

/** Slim dismissible announcement bar above the navbar. */
export function NexaAnnounce() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="nx-announce">
      <p>
        Free shipping on orders over ${STORE.freeShippingOver} — {STORE.promo}
      </p>
      <button aria-label="Dismiss announcement" onClick={() => setOpen(false)}>
        ✕
      </button>
    </div>
  );
}
