import type { ThemeTokens } from "@/lib/design-tokens";
import {
  cssVarsToRootBlock,
  googleFontsHref,
  themeToCssVars,
} from "@/lib/design-tokens";

/**
 * Server component that injects the active theme as CSS custom properties into
 * the document, plus the Google Fonts link for the families the theme uses.
 *
 * Because this runs on the server and writes the variables into the initial
 * HTML, there is no flash of unstyled content and no client round-trip.
 */
export function ThemeStyle({ tokens }: { tokens: ThemeTokens }) {
  const vars = themeToCssVars(tokens);
  const root = cssVarsToRootBlock(vars);
  const fontsHref = googleFontsHref(tokens);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={fontsHref} />
      <style
        id="ndh-theme-vars"
        dangerouslySetInnerHTML={{ __html: root }}
      />
    </>
  );
}
