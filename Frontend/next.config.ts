import type { NextConfig } from "next";

// Same origin the API client actually calls (see lib/api/client.ts) — CSP's
// connect-src has to allow it or every fetch from the browser breaks.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").origin;
  } catch {
    return "http://localhost:5000";
  }
})();

// Mirrors the backend's own CSP posture (src/app.ts in the API) — this app
// previously shipped with zero security headers at all. 'unsafe-inline' on
// script-src/style-src is a pragmatic trade-off, not an oversight: Next.js's
// App Router hydration bootstrap and this app's theme-token <style> tag
// (ThemeStyle.tsx / ShopThemeStyle.tsx, dangerouslySetInnerHTML) both need
// it, and a nonce-based strict CSP would require threading a per-request
// nonce through every script/style boundary — same documented trade-off the
// backend makes for Swagger UI on the same grounds.
const csp = [
  "default-src 'self'",
  // 'unsafe-eval' is dev-only — Next.js/Turbopack's dev-mode React DevTools
  // instrumentation uses eval() to reconstruct stack traces across module
  // boundaries. React never uses eval() in production, so prod keeps the
  // stricter script-src with no eval allowance.
  // https://www.google.com/recaptcha + https://www.gstatic.com/recaptcha are
  // reCAPTCHA v2's own script/render hosts (CaptchaWidget.tsx) — without
  // these the widget script itself is CSP-blocked, not just the token call.
  `script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // Matches the images.remotePatterns list below — keep the two in sync.
  "img-src 'self' data: https://picsum.photos https://images.unsplash.com https://fastly.picsum.photos https://res.cloudinary.com",
  `connect-src 'self' ${apiOrigin} https://www.google.com`,
  // The reCAPTCHA checkbox/challenge itself renders inside a google.com
  // iframe — with no frame-src at all this falls back to default-src 'self'
  // and silently blocks the widget even once the script above loads fine.
  "frame-src 'self' https://www.google.com/recaptcha/",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Lean, self-contained production build for Docker — see Dockerfile.
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
