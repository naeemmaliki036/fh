"use client";

import { Toaster } from "sonner";

export function ToasterProvider(): React.ReactElement {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
    />
  );
}
