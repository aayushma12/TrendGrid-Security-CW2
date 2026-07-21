import type { Metadata } from "next";
import "./globals.css";
import FontChecker from "@/components/FontChecker";

export const metadata: Metadata = {
  title: {
    default: "NDH TrendGrid",
    template: "%s · NDH TrendGrid",
  },
  description:
    "Multi-tenant eCommerce platform with full visual sovereignty — every pixel driven by themeable design tokens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla, VS Code
          Live Preview) inject attributes like cz-shortcut-listen / vsc-initialized
          onto <body> before React hydrates — harmless, so we silence the noise. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <FontChecker />
        {children}
      </body>
    </html>
  );
}
