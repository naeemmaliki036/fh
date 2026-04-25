import type { Metadata } from "next";
import "@/styles/globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToasterProvider } from "@/components/providers/ToasterProvider";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "fh Real Estate Platform",
  description: "Multi-tenant real estate SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
            <ToasterProvider />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
