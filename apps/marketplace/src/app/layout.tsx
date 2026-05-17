import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { CountryProvider } from "@/lib/country-context";
import { ConsumerProvider } from "@/lib/consumer-context";
import { CountryGateModal } from "@/components/CountryGateModal";
import { FavoritesHydrator } from "@/components/FavoritesHydrator";
import { Toaster } from "sonner";
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
          <ConsumerProvider>
            <CountryProvider>
              <FavoritesHydrator />
              <CountryGateModal />
              {children}
              <Toaster richColors position="top-right" />
            </CountryProvider>
          </ConsumerProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
