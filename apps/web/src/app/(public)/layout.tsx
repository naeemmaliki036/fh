import type { ReactNode } from "react";
import "@/styles/globals.css";

/** Public property sites always render in light mode regardless of admin preference. */
export default function PublicLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <div className="light min-h-screen" data-theme="light">
      {children}
    </div>
  );
}
