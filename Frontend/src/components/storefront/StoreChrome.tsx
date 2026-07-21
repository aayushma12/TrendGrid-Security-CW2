"use client";

/**
 * Global storefront chrome — mounted once in the (shop) layout.
 * Renders the cart drawer, search overlay, toast stack, scroll-to-top button
 * and route progress bar, and wires the Cmd/Ctrl+K search shortcut plus the
 * initial scroll-reveal pass.
 */

import { useEffect } from "react";
import { useStore } from "@/lib/store-context";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { SearchOverlay } from "@/components/storefront/SearchOverlay";
import { ToastStack, ScrollTopButton } from "@/components/storefront/Interactions";
import { ParallaxMount } from "@/components/storefront/HomeMotion";
import { RouteProgress } from "@/components/storefront/PageTransition";
import { initReveal } from "@/lib/reveal";

export function StoreChrome() {
  const { openSearch, searchOpen } = useStore();

  // Cmd/Ctrl+K opens search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!searchOpen) openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch, searchOpen]);

  // initial reveal pass on mount
  useEffect(() => {
    initReveal();
  }, []);

  return (
    <>
      <RouteProgress />
      <CartDrawer />
      <SearchOverlay />
      <ToastStack />
      <ScrollTopButton />
      <ParallaxMount />
    </>
  );
}
