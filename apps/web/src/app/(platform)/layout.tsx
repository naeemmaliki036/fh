import type { ReactNode } from "react";
import { PlatformShell } from "@/components/templates/PlatformShell";

export default function PlatformLayout({ children }: { children: ReactNode }): React.ReactElement {
  return <PlatformShell>{children}</PlatformShell>;
}
