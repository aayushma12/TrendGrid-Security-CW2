"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Pluggable CAPTCHA widget for login/register/forgot-password. Mirrors the
 * API's own CAPTCHA design (utils/captcha.ts): a no-op when no provider is
 * configured, so local dev/CI/coursework demos never depend on reaching an
 * external CDN. Set NEXT_PUBLIC_CAPTCHA_PROVIDER (hcaptcha|recaptcha) +
 * NEXT_PUBLIC_CAPTCHA_SITE_KEY to activate it — the matching CAPTCHA_SECRET
 * must also be set on the API for it to actually be enforced server-side.
 */

type Provider = "hcaptcha" | "recaptcha";

const SCRIPT_SRC: Record<Provider, string> = {
  hcaptcha: "https://js.hcaptcha.com/1/api.js?render=explicit",
  recaptcha: "https://www.google.com/recaptcha/api.js?render=explicit",
};

const getProvider = (): Provider | null => {
  const raw = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER;
  return raw === "hcaptcha" || raw === "recaptcha" ? raw : null;
};

const getSiteKey = (): string | null => process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || null;

/** Whether a provider+site key are configured — callers use this to decide
 *  whether to require a token before submitting (no-op when unset, matching
 *  the widget's own render-nothing behaviour). */
export const isCaptchaEnabled = (): boolean => getProvider() !== null && getSiteKey() !== null;

let scriptLoadPromise: Promise<void> | null = null;
const loadScript = (provider: Provider): Promise<void> => {
  if (scriptLoadPromise) return scriptLoadPromise;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC[provider];
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load CAPTCHA script"));
    document.head.appendChild(script);
  }).catch((err: unknown) => {
    // Don't cache a failure forever — a genuine network blip should be
    // retryable, not a permanent dead end for the rest of the session.
    scriptLoadPromise = null;
    throw err;
  });
  scriptLoadPromise = promise;
  return promise;
};

declare global {
  interface Window {
    hcaptcha?: { render: (container: string, opts: Record<string, unknown>) => void };
    grecaptcha?: {
      render: (container: string, opts: Record<string, unknown>) => void;
      /** Google's script does async init work even after the <script> tag's
       *  own load event fires — render() before ready() resolves throws
       *  intermittently. This is the documented fix, not optional. */
      ready: (cb: () => void) => void;
    };
  }
}

type LoadState = "loading" | "ready" | "failed";

export function CaptchaWidget({ onToken }: { onToken: (token: string | undefined) => void }) {
  const provider = getProvider();
  const siteKey = getSiteKey();
  const containerId = `captcha-${useId().replace(/[:]/g, "")}`;
  const rendered = useRef(false);
  const [state, setState] = useState<LoadState>("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!provider || !siteKey || rendered.current) return;
    rendered.current = true;

    const doRender = () => {
      try {
        const api = provider === "hcaptcha" ? window.hcaptcha : window.grecaptcha;
        if (!api) throw new Error("CAPTCHA API missing after load");
        api.render(containerId, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(undefined),
          "error-callback": () => onToken(undefined),
        });
        setState("ready");
      } catch {
        setState("failed");
        onToken(undefined);
      }
    };

    loadScript(provider)
      .then(() => {
        // reCAPTCHA needs grecaptcha.ready() — its render() is not safe to
        // call right after the script tag's onload. hCaptcha's api.js is
        // synchronously usable once loaded, so it can render immediately.
        if (provider === "recaptcha" && window.grecaptcha?.ready) {
          window.grecaptcha.ready(doRender);
        } else {
          doRender();
        }
      })
      .catch(() => {
        setState("failed");
        onToken(undefined);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, siteKey, containerId, retryCount]);

  if (!provider || !siteKey) return null;

  return (
    <div>
      <div id={containerId} style={{ margin: "4px 0", display: state === "failed" ? "none" : undefined }} />
      {state === "loading" && (
        <p style={{ fontSize: 12.5, color: "#6b7280", margin: "4px 0" }}>Loading verification…</p>
      )}
      {state === "failed" && (
        <p role="alert" style={{ fontSize: 12.5, color: "#b91c1c", margin: "4px 0" }}>
          CAPTCHA failed to load. Check your connection and{" "}
          <button
            type="button"
            onClick={() => {
              rendered.current = false;
              setState("loading");
              setRetryCount((n) => n + 1);
            }}
            style={{ color: "inherit", textDecoration: "underline", background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
          >
            try again
          </button>
          .
        </p>
      )}
    </div>
  );
}
