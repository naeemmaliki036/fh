import type { ReactNode } from "react";
import "@/styles/globals.css";

export default function PublicLayout({ children }: { children: ReactNode }): React.ReactElement {
  return <div className="min-h-screen">{children}</div>;
}
