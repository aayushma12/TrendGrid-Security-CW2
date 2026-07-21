"use client";

import { useEffect } from "react";

/**
 * When the storefront is embedded in the admin Theme Builder preview iframe,
 * this listens for token updates posted by the parent window and applies them
 * as CSS variables in real time — giving sub-second live preview with no reload.
 */
export function PreviewBridge() {
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const msg = e.data;
      if (!msg || msg.type !== "ndh-preview-tokens") return;
      const vars = msg.cssVars as Record<string, string> | undefined;
      if (!vars) return;
      const root = document.documentElement;
      for (const [k, v] of Object.entries(vars)) {
        root.style.setProperty(k, v);
      }
    }
    window.addEventListener("message", onMessage);
    // Signal readiness so the parent can push the current tokens.
    window.parent?.postMessage({ type: "ndh-preview-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
