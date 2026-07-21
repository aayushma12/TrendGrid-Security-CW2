import { DEFAULT_THEME_TOKENS } from "@/lib/theme-defaults";
import { themeToCssVars } from "@/lib/design-tokens";

export function ShopThemeStyle() {
  const vars = themeToCssVars(DEFAULT_THEME_TOKENS);
  const lines = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return (
    <>
      {/* Luxury type system: Cormorant Garamond (serif display) + Jost + Poppins */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700;900&family=Jost:wght@300;400;500;600;700&display=swap"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `.shop {\n${lines}\n  --lux-serif: "Cormorant Garamond", Georgia, "Times New Roman", serif;\n}`,
        }}
      />
    </>
  );
}
