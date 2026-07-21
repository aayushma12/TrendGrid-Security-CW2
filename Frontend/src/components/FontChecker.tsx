"use client";

import { useEffect } from "react";

function timeout(ms: number) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));
}

const FONTS: { url: string; weight: string; style: string }[] = [];

export default function FontChecker() {
  useEffect(() => {
    let mounted = true;

    async function check() {
      const missing: string[] = [];

      await Promise.all(
        FONTS.map(async (f) => {
          try {
            // Try to load a tiny FontFace to verify the file exists and is valid.
            const ff = new FontFace("Handel-verify-" + f.weight + f.style, `url(${f.url}) format("woff2")`, {
              weight: f.weight,
              style: f.style,
            } satisfies FontFaceDescriptors);

            // Use a short timeout so a slow network doesn't block startup.
            await Promise.race([ff.load(), timeout(3000)]);

            // If loaded, add to document.fonts so the browser can use it later.
            try {
              document.fonts.add(ff);
            } catch {
              // ignore — some browsers may throw when adding duplicate faces
            }
          } catch {
            missing.push(f.url);
          }
        }),
      );

      if (!mounted) return;
      if (missing.length === 0) {
        document.documentElement.setAttribute("data-fonts", "ok");
        console.info("FontChecker: all Handel font files present.");
      } else {
        document.documentElement.setAttribute("data-fonts", "missing");
        console.warn("FontChecker: missing Handel font files:", missing);
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
