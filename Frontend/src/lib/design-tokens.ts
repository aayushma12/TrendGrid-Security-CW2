// ============================================================================
// Design Tokens — the single source of truth that turns a Theme row from the
// database into a flat map of CSS custom properties.
//
// IRON LAW: storefront components reference ONLY var(--token) values. They must
// never contain a literal color / font / radius / shadow. This file is the
// bridge between the database and the rendered pixel.
// ============================================================================

/**
 * Shape of the design-token fields on the Theme model. Kept structurally
 * compatible with the Prisma `Theme` type but declared independently so the
 * converter has no runtime dependency on the generated client.
 */
export interface ThemeTokens {
  // ---- COLOR ----
  colorPrimary: string;
  colorPrimaryHover: string;
  colorPrimaryActive: string;
  colorPrimaryForeground: string;
  colorSecondary: string;
  colorSecondaryHover: string;
  colorSecondaryForeground: string;
  colorAccent: string;
  colorAccentHover: string;
  colorAccentForeground: string;
  colorBackground: string;
  colorSurface: string;
  colorSurfaceElevated: string;
  colorBorder: string;
  colorBorderFocus: string;
  colorText: string;
  colorTextMuted: string;
  colorTextInverse: string;
  colorSuccess: string;
  colorSuccessForeground: string;
  colorWarning: string;
  colorWarningForeground: string;
  colorError: string;
  colorErrorForeground: string;
  colorInfo: string;
  colorInfoForeground: string;
  colorOverlay: string;
  colorSkeleton: string;

  // ---- TYPOGRAPHY ----
  fontFamilyDisplay: string;
  fontFamilyBody: string;
  fontFamilyMono: string;
  fontFamilyUI: string;
  fontWeightLight: number;
  fontWeightRegular: number;
  fontWeightMedium: number;
  fontWeightSemibold: number;
  fontWeightBold: number;
  fontWeightBlack: number;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeBase: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontSize2xl: string;
  fontSize3xl: string;
  fontSize4xl: string;
  fontSize5xl: string;
  lineHeightTight: number;
  lineHeightNormal: number;
  lineHeightRelaxed: number;
  letterSpacingTight: string;
  letterSpacingNormal: string;
  letterSpacingWide: string;

  // ---- SPACING & LAYOUT ----
  spacingUnit: string;
  containerMaxWidth: string;
  containerPaddingX: string;
  sectionPaddingY: string;
  gridGap: string;
  gridColumns: number;
  gridColumnsMobile: number;

  // ---- BORDER & SHAPE ----
  borderRadiusNone: string;
  borderRadiusSm: string;
  borderRadiusMd: string;
  borderRadiusLg: string;
  borderRadiusXl: string;
  borderRadius2xl: string;
  borderRadiusFull: string;
  borderRadiusCard: string;
  borderRadiusButton: string;
  borderRadiusInput: string;
  borderRadiusBadge: string;
  borderRadiusImage: string;
  borderWidth: string;
  borderStyle: string;
  borderColor: string;

  // ---- SHADOW ----
  shadowNone: string;
  shadowXs: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  shadowInner: string;
  shadowGlow: string;
  shadowCard: string; // references a shadow key, e.g. "sm"
  shadowCardHover: string;
  shadowButton: string;
  shadowModal: string;
  shadowDropdown: string;
  shadowColor: string;

  // ---- BUTTON ----
  buttonShape: string;
  buttonVariantPrimary: string;
  buttonVariantSecondary: string;
  buttonHoverEffect: string;
  buttonTransitionMs: number;
  buttonPaddingX: string;
  buttonPaddingY: string;
  buttonFontWeight: number;
  buttonLetterSpacing: string;
  buttonTextTransform: string;
  buttonIconPosition: string;
  buttonLoadingStyle: string;

  // ---- CARD ----
  cardStyle: string;
  cardHoverEffect: string;
  cardHoverTransitionMs: number;
  cardImageRatio: string;
  cardImageFit: string;
  cardImagePosition: string;
  cardPaddingX: string;
  cardPaddingY: string;
  cardShowQuickBuy: boolean;
  cardShowWishlist: boolean;
  cardShowCompare: boolean;
  cardShowRating: boolean;
  cardShowBadges: boolean;
  cardBadgeStyle: string;

  // ---- PATTERN ----
  patternType: string;
  patternColorA: string;
  patternColorB: string;
  patternColorC: string;
  patternOpacity: number;
  patternSize: string;
  patternAngle: number;
  patternBlur: string;
  patternSaturation: number;
  overlayType: string;
  overlayColor: string;
  overlayOpacity: number;
  overlayBlendMode: string;

  // ---- ANIMATION ----
  animationEnabled: boolean;
  animationReducedMotion: boolean;
  animationEntrance: string;
  animationEntranceDuration: number;
  animationEntranceDelay: number;
  animationEasing: string;
  animationStagger: number;
  animationScrollTrigger: boolean;
  animationHoverScale: number;
  animationHoverDuration: number;
  animationPageTransition: string;
  animationLoadingStyle: string;

  // ---- HEADER & NAV ----
  headerStyle: string;
  headerHeight: string;
  headerSticky: boolean;
  headerScrollBehavior: string;
  navStyle: string;
  navItemSpacing: string;
  navActiveIndicator: string;
  mobileMenuStyle: string;
  cartIconStyle: string;
}

/** Convert an image-ratio token like "4:3" into a CSS aspect-ratio value. */
export function ratioToAspect(ratio: string): string {
  const [w, h] = ratio.split(":");
  if (w && h) return `${w} / ${h}`;
  return "1 / 1";
}

/** Map an easing keyword to a CSS timing function. */
export function easingToCss(easing: string): string {
  switch (easing) {
    case "easeIn":
      return "cubic-bezier(0.4, 0, 1, 1)";
    case "easeOut":
      return "cubic-bezier(0, 0, 0.2, 1)";
    case "easeInOut":
      return "cubic-bezier(0.4, 0, 0.2, 1)";
    case "spring":
      return "cubic-bezier(0.34, 1.56, 0.64, 1)";
    case "bounce":
      return "cubic-bezier(0.68, -0.55, 0.27, 1.55)";
    case "ease":
    default:
      return "ease";
  }
}

/** Resolve a shadow "reference" token (e.g. "sm") to its CSS var. */
function shadowRef(value: string): string {
  const key = value?.toLowerCase?.() ?? "";
  const known = ["none", "xs", "sm", "md", "lg", "xl", "inner", "glow"];
  if (known.includes(key)) {
    return `var(--shadow-${key})`;
  }
  // Already a raw box-shadow value
  return value;
}

/**
 * The core converter. Produces a flat `{ "--token": "value" }` map ready to be
 * serialised into a `:root { ... }` block or applied to an element's style.
 */
export function themeToCssVars(t: ThemeTokens): Record<string, string> {
  const v: Record<string, string> = {
    // ---- COLOR ----
    "--color-primary": t.colorPrimary,
    "--color-primary-hover": t.colorPrimaryHover,
    "--color-primary-active": t.colorPrimaryActive,
    "--color-primary-foreground": t.colorPrimaryForeground,
    "--color-secondary": t.colorSecondary,
    "--color-secondary-hover": t.colorSecondaryHover,
    "--color-secondary-foreground": t.colorSecondaryForeground,
    "--color-accent": t.colorAccent,
    "--color-accent-hover": t.colorAccentHover,
    "--color-accent-foreground": t.colorAccentForeground,
    "--color-background": t.colorBackground,
    "--color-surface": t.colorSurface,
    "--color-surface-elevated": t.colorSurfaceElevated,
    "--color-border": t.colorBorder,
    "--color-border-focus": t.colorBorderFocus,
    "--color-text": t.colorText,
    "--color-text-muted": t.colorTextMuted,
    "--color-text-inverse": t.colorTextInverse,
    "--color-success": t.colorSuccess,
    "--color-success-foreground": t.colorSuccessForeground,
    "--color-warning": t.colorWarning,
    "--color-warning-foreground": t.colorWarningForeground,
    "--color-error": t.colorError,
    "--color-error-foreground": t.colorErrorForeground,
    "--color-info": t.colorInfo,
    "--color-info-foreground": t.colorInfoForeground,
    "--color-overlay": t.colorOverlay,
    "--color-skeleton": t.colorSkeleton,

    // ---- TYPOGRAPHY ----
    "--font-display": quoteFont(t.fontFamilyDisplay),
    "--font-body": quoteFont(t.fontFamilyBody),
    "--font-mono": quoteFont(t.fontFamilyMono),
    "--font-ui": quoteFont(t.fontFamilyUI),
    "--font-weight-light": String(t.fontWeightLight),
    "--font-weight-regular": String(t.fontWeightRegular),
    "--font-weight-medium": String(t.fontWeightMedium),
    "--font-weight-semibold": String(t.fontWeightSemibold),
    "--font-weight-bold": String(t.fontWeightBold),
    "--font-weight-black": String(t.fontWeightBlack),
    "--font-size-xs": t.fontSizeXs,
    "--font-size-sm": t.fontSizeSm,
    "--font-size-base": t.fontSizeBase,
    "--font-size-lg": t.fontSizeLg,
    "--font-size-xl": t.fontSizeXl,
    "--font-size-2xl": t.fontSize2xl,
    "--font-size-3xl": t.fontSize3xl,
    "--font-size-4xl": t.fontSize4xl,
    "--font-size-5xl": t.fontSize5xl,
    "--line-height-tight": String(t.lineHeightTight),
    "--line-height-normal": String(t.lineHeightNormal),
    "--line-height-relaxed": String(t.lineHeightRelaxed),
    "--letter-spacing-tight": t.letterSpacingTight,
    "--letter-spacing-normal": t.letterSpacingNormal,
    "--letter-spacing-wide": t.letterSpacingWide,

    // ---- SPACING & LAYOUT ----
    "--spacing-unit": t.spacingUnit,
    "--container-max-width": t.containerMaxWidth,
    "--container-padding-x": t.containerPaddingX,
    "--section-padding-y": t.sectionPaddingY,
    "--grid-gap": t.gridGap,
    "--grid-columns": String(t.gridColumns),
    "--grid-columns-mobile": String(t.gridColumnsMobile),

    // ---- BORDER & SHAPE ----
    "--radius-none": t.borderRadiusNone,
    "--radius-sm": t.borderRadiusSm,
    "--radius-md": t.borderRadiusMd,
    "--radius-lg": t.borderRadiusLg,
    "--radius-xl": t.borderRadiusXl,
    "--radius-2xl": t.borderRadius2xl,
    "--radius-full": t.borderRadiusFull,
    "--radius-card": t.borderRadiusCard,
    "--radius-button": t.borderRadiusButton,
    "--radius-input": t.borderRadiusInput,
    "--radius-badge": t.borderRadiusBadge,
    "--radius-image": t.borderRadiusImage,
    "--border-width": t.borderWidth,
    "--border-style": t.borderStyle,
    "--border-color": t.borderColor,

    // ---- SHADOW (base values) ----
    "--shadow-none": t.shadowNone,
    "--shadow-xs": t.shadowXs,
    "--shadow-sm": t.shadowSm,
    "--shadow-md": t.shadowMd,
    "--shadow-lg": t.shadowLg,
    "--shadow-xl": t.shadowXl,
    "--shadow-inner": t.shadowInner,
    "--shadow-glow": t.shadowGlow,
    "--shadow-color": t.shadowColor,
    // ---- SHADOW (semantic references) ----
    "--shadow-card": shadowRef(t.shadowCard),
    "--shadow-card-hover": shadowRef(t.shadowCardHover),
    "--shadow-button": shadowRef(t.shadowButton),
    "--shadow-modal": shadowRef(t.shadowModal),
    "--shadow-dropdown": shadowRef(t.shadowDropdown),

    // ---- BUTTON ----
    "--button-radius":
      t.buttonShape === "pill"
        ? "var(--radius-full)"
        : t.buttonShape === "square"
          ? "var(--radius-none)"
          : "var(--radius-button)",
    "--button-transition": `${t.buttonTransitionMs}ms`,
    "--button-padding-x": t.buttonPaddingX,
    "--button-padding-y": t.buttonPaddingY,
    "--button-font-weight": String(t.buttonFontWeight),
    "--button-letter-spacing": t.buttonLetterSpacing,
    "--button-text-transform": t.buttonTextTransform,

    // ---- CARD ----
    "--card-radius": "var(--radius-card)",
    "--card-transition": `${t.cardHoverTransitionMs}ms`,
    "--card-image-aspect": ratioToAspect(t.cardImageRatio),
    "--card-image-fit": t.cardImageFit,
    "--card-image-position": t.cardImagePosition,
    "--card-padding-x": t.cardPaddingX,
    "--card-padding-y": t.cardPaddingY,

    // ---- PATTERN / OVERLAY ----
    "--pattern-color-a": t.patternColorA,
    "--pattern-color-b": t.patternColorB,
    "--pattern-color-c": t.patternColorC,
    "--pattern-opacity": String(t.patternOpacity),
    "--pattern-size": t.patternSize,
    "--pattern-angle": `${t.patternAngle}deg`,
    "--pattern-blur": t.patternBlur,
    "--pattern-saturation": `${t.patternSaturation}%`,
    "--overlay-color": t.overlayColor,
    "--overlay-opacity": String(t.overlayOpacity),
    "--overlay-blend-mode": t.overlayBlendMode,

    // ---- ANIMATION ----
    "--animation-duration": `${t.animationEntranceDuration}ms`,
    "--animation-delay": `${t.animationEntranceDelay}ms`,
    "--animation-easing": easingToCss(t.animationEasing),
    "--animation-stagger": `${t.animationStagger}ms`,
    "--animation-hover-scale": String(t.animationHoverScale),
    "--animation-hover-duration": `${t.animationHoverDuration}ms`,

    // ---- HEADER & NAV ----
    "--header-height": t.headerHeight,
    "--nav-item-spacing": t.navItemSpacing,
  };

  return v;
}

/** Wrap multi-word font names in quotes and add a sensible fallback stack. */
function quoteFont(name: string): string {
  if (!name) return "system-ui, sans-serif";
  const quoted = /\s/.test(name) ? `"${name}"` : name;
  return `${quoted}, system-ui, sans-serif`;
}

/** Serialise a CSS-var map into a `:root { ... }` string for SSR injection. */
export function cssVarsToRootBlock(vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([k, val]) => `  ${k}: ${val};`)
    .join("\n");
  return `:root {\n${body}\n}`;
}

/** Collect the unique Google Font families a theme needs so they can be loaded. */
export function fontsUsed(t: ThemeTokens): string[] {
  // Return the unique families declared on the theme. Do NOT include empty
  // values. Note: we do NOT filter here for Google-hosted fonts so callers
  // may choose how to handle local fonts; googleFontsHref will filter to
  // known Google font families only.
  return Array.from(
    new Set(
      [t.fontFamilyDisplay, t.fontFamilyBody, t.fontFamilyMono, t.fontFamilyUI].filter(Boolean),
    ),
  );
}

/** Build a Google Fonts stylesheet URL for the families a theme uses. */
export function googleFontsHref(t: ThemeTokens): string {
  // Only attempt to build a Google Fonts URL for families we explicitly
  // recognise as Google-served fonts. Local or custom fonts (for example
  // `Handel`) will be ignored so the app doesn't request them from Google.
  const families = fontsUsed(t)
    .filter((f) => POPULAR_GOOGLE_FONTS.includes(f))
    .map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;900`)
    .join("&");

  if (!families) return "";
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/** A curated subset of popular Google Fonts for the admin font picker. */
export const POPULAR_GOOGLE_FONTS: string[] = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Source Sans 3",
  "Raleway",
  "Nunito",
  "Work Sans",
  "Manrope",
  "DM Sans",
  "Plus Jakarta Sans",
  "Space Grotesk",
  "Outfit",
  "Sora",
  "Playfair Display",
  "Merriweather",
  "Lora",
  "Cormorant Garamond",
  "EB Garamond",
  "Libre Baskerville",
  "Bricolage Grotesque",
  "Figtree",
  "Geist",
  "JetBrains Mono",
  "Fira Code",
  "IBM Plex Mono",
  "Roboto Mono",
  "Space Mono",
];

export const PATTERN_TYPES: string[] = [
  "solid",
  "linearGradient",
  "radialGradient",
  "angularGradient",
  "meshGradient",
  "dotGrid",
  "lineGrid",
  "crossGrid",
  "diagonalLines",
  "waves",
  "noiseTecture",
  "glassmorphism",
  "frostedGlass",
  "geometricHexagon",
  "geometricTriangle",
  "geometricCircles",
  "chevronPattern",
  "herringbone",
  "topographicMap",
  "circuitBoard",
  "carbonFiber",
  "linen",
  "paper",
  "marble",
  "concrete",
];
