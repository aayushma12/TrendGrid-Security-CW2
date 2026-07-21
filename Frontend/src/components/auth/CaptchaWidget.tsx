"use client";

import { useEffect, useId, useRef } from "react";

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

let scriptLoadPromise: Promise<void> | null = null;
const loadScript = (provider: Provider): Promise<void> => {
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC[provider];
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load CAPTCHA script"));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
};

declare global {
  interface Window {
    hcaptcha?: { render: (container: string, opts: Record<string, unknown>) => void };
    grecaptcha?: { render: (container: string, opts: Record<string, unknown>) => void };
  }
}

export function CaptchaWidget({ onToken }: { onToken: (token: string | undefined) => void }) {
  const provider = getProvider();
  const siteKey = getSiteKey();
  const containerId = `captcha-${useId().replace(/[:]/g, "")}`;
  const rendered = useRef(false);

  useEffect(() => {
    if (!provider || !siteKey || rendered.current) return;
    rendered.current = true;

    loadScript(provider)
      .then(() => {
        const api = provider === "hcaptcha" ? window.hcaptcha : window.grecaptcha;
        if (!api) return;
        const callbackOpt = provider === "hcaptcha" ? "callback" : "callback";
        api.render(containerId, {
          sitekey: siteKey,
          [callbackOpt]: (token: string) => onToken(token),
          "expired-callback": () => onToken(undefined),
          "error-callback": () => onToken(undefined),
        });
      })
      .catch(() => onToken(undefined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, siteKey, containerId]);

  if (!provider || !siteKey) return null;

  return <div id={containerId} style={{ margin: "4px 0" }} />;
}
