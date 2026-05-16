import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { CountryProvider } from "@/lib/country-context";
import { CountryGateModal } from "@/components/CountryGateModal";
import { PORTAL_BRAND_NAME, PORTAL_BRAND_TAGLINE } from "@/lib/portal-brand";

export const metadata: Metadata = {
  title: `${PORTAL_BRAND_NAME} — Global Property Marketplace`,
  description: PORTAL_BRAND_TAGLINE,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

// Sets the iOS / Android browser chrome colour AND the overscroll bounce
// background. Without this, refresh / pull-to-refresh can flash a yellow
// strip from the browser default fallback.
export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" className="bg-white">
      <body className="antialiased bg-white">
        <QueryProvider>
          <CountryProvider>
            <CountryGateModal />
            {children}
          </CountryProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
