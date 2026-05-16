import type { Metadata } from "next";
import "@/styles/globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { CountryProvider } from "@/lib/country-context";
import { CountryGateModal } from "@/components/CountryGateModal";
import { PORTAL_BRAND_NAME, PORTAL_BRAND_TAGLINE } from "@/lib/portal-brand";

export const metadata: Metadata = {
  title: `${PORTAL_BRAND_NAME} — Global Property Marketplace`,
  description: PORTAL_BRAND_TAGLINE,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="antialiased">
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
