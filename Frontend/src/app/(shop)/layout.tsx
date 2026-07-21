import "@/styles/shop.css";
import "@/styles/motion.css";
import "@/styles/beige.css";
import "@/styles/pages.css";
import "@/styles/cart.css";
import "@/styles/home-enhance.css";
import "@/styles/home-luxe.css";
import "@/styles/art-hero.css";
import "@/styles/trending-scatter.css";
import "@/styles/home-nexa.css";
import { Space_Grotesk, Manrope, Instrument_Serif } from "next/font/google";
import { ShopThemeStyle } from "@/components/storefront/ShopThemeStyle";
import { MobileNav } from "@/components/storefront/MobileNav";
import { StoreProvider } from "@/lib/store-context";
import { NexaChrome } from "@/components/home-nexa/NexaChrome";
import { PageTransition } from "@/components/storefront/PageTransition";
import { AuthProvider } from "@/lib/auth-context";
import { HomepageProvider } from "@/lib/homepage-context";

/* Nexa home typography: tight geometric display + warm humanist body.
   Exposed as CSS variables; only .nx-scoped rules consume them, so the
   rest of the shop keeps its token-driven fonts. */
const nexaDisplay = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-nexa-display",
  display: "swap",
});
const nexaBody = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nexa-body",
  display: "swap",
});
const nexaSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-nexa-serif",
  display: "swap",
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShopThemeStyle />
      {/* AuthProvider is additive: it only exposes a null user until someone
          signs in via /login, so it doesn't affect the existing mock storefront. */}
      <AuthProvider scope="customer">
        <StoreProvider>
          <HomepageProvider>
            <div className={`shop ${nexaDisplay.variable} ${nexaBody.variable} ${nexaSerif.variable}`}>
              <PageTransition>{children}</PageTransition>
              <MobileNav />
              <NexaChrome />
            </div>
          </HomepageProvider>
        </StoreProvider>
      </AuthProvider>
    </>
  );
}
