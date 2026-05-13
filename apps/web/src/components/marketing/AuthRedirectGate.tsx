"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AuthRedirectGate(): null {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tenantToken = localStorage.getItem("fh_tenant_access_token");
    const platformToken = localStorage.getItem("fh_platform_access_token");
    if (platformToken) {
      router.replace("/tenants");
    } else if (tenantToken) {
      router.replace("/dashboard");
    }
  }, [router]);

  return null;
}
