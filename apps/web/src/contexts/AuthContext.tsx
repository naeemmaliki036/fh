"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { useMe, usePlatformMe } from "@/hooks/queries/useAuth";
import { authRepository } from "@/lib/api/repositories";
import { getTenantToken, getPlatformToken } from "@/lib/api/client";
import type { MeResponse, JwtClaims } from "@/lib/types";

interface AuthContextValue {
  currentUser: MeResponse | null;
  currentPlatformUser: MeResponse | null;
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
  tenantId: string | null;
  isLoading: boolean;
  logout: () => void;
  platformLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeToken(token: string | null): JwtClaims | null {
  if (!token) return null;
  try {
    return jwtDecode<JwtClaims>(token);
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const tenantToken = typeof window !== "undefined" ? getTenantToken() : null;
  const platformToken = typeof window !== "undefined" ? getPlatformToken() : null;

  const tenantClaims = decodeToken(tenantToken);
  const platformClaims = decodeToken(platformToken);

  const hasTenantToken = !!tenantToken && !!tenantClaims && tenantClaims.exp > Date.now() / 1000;
  const hasPlatformToken =
    !!platformToken && !!platformClaims && platformClaims.exp > Date.now() / 1000;

  const { data: currentUser, isLoading: loadingUser } = useMe(hasTenantToken);
  const { data: currentPlatformUser, isLoading: loadingPlatform } = usePlatformMe(hasPlatformToken);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser: currentUser ?? null,
      currentPlatformUser: currentPlatformUser ?? null,
      isAuthenticated: !!currentUser,
      isPlatformAdmin: !!currentPlatformUser,
      tenantId: currentUser?.tenant_id ?? null,
      isLoading: loadingUser || loadingPlatform,
      logout: () => authRepository.logout(),
      platformLogout: () => authRepository.platformLogout(),
    }),
    [currentUser, currentPlatformUser, loadingUser, loadingPlatform],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
