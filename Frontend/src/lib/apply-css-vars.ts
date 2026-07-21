import type { ThemeTokens } from "./design-tokens";
import { themeToCssVars } from "./design-tokens";

/**
 * Client-side optimistic injection: write the theme's CSS variables directly
 * onto a target element (defaults to :root). Used by the admin Theme Builder so
 * the preview updates instantly as the user drags a slider, with no API call.
 */
export function applyCssVars(
  tokens: ThemeTokens,
  target?: HTMLElement | null,
): void {
  const el = target ?? document.documentElement;
  const vars = themeToCssVars(tokens);
  for (const [key, value] of Object.entries(vars)) {
    el.style.setProperty(key, value);
  }
}
