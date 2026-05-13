import axios, { type AxiosError, type AxiosInstance } from "axios";
import { ApiError, type ApiErrorResponse } from "./errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Token storage keys ───────────────────────────────────────────────────────
const TENANT_ACCESS_KEY = "fh_tenant_access_token";
const TENANT_REFRESH_KEY = "fh_tenant_refresh_token";
const PLATFORM_ACCESS_KEY = "fh_platform_access_token";
const PLATFORM_REFRESH_KEY = "fh_platform_refresh_token";

// ── Token helpers ────────────────────────────────────────────────────────────
export function getTenantToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TENANT_ACCESS_KEY);
}

export function getPlatformToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLATFORM_ACCESS_KEY);
}

export function setTenantTokens(access: string, refresh: string): void {
  localStorage.setItem(TENANT_ACCESS_KEY, access);
  localStorage.setItem(TENANT_REFRESH_KEY, refresh);
  if (typeof document !== "undefined") {
    document.cookie = `fh_tenant_access_token=${access}; path=/; max-age=1800`;
  }
}

export function setPlatformTokens(access: string, refresh: string): void {
  localStorage.setItem(PLATFORM_ACCESS_KEY, access);
  localStorage.setItem(PLATFORM_REFRESH_KEY, refresh);
  if (typeof document !== "undefined") {
    document.cookie = `fh_platform_access_token=${access}; path=/; max-age=1800`;
  }
}

export function clearTenantTokens(): void {
  localStorage.removeItem(TENANT_ACCESS_KEY);
  localStorage.removeItem(TENANT_REFRESH_KEY);
  if (typeof document !== "undefined") {
    document.cookie = "fh_tenant_access_token=; path=/; max-age=0";
  }
}

export function clearPlatformTokens(): void {
  localStorage.removeItem(PLATFORM_ACCESS_KEY);
  localStorage.removeItem(PLATFORM_REFRESH_KEY);
  if (typeof document !== "undefined") {
    document.cookie = "fh_platform_access_token=; path=/; max-age=0";
  }
}

// ── Refresh queue machinery ─────────────────────────────────────────────────
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };

function makeRefreshQueue(): {
  isRefreshing: boolean;
  queue: QueueEntry[];
  process: (err: unknown, token: string | null) => void;
} {
  return {
    isRefreshing: false,
    queue: [] as QueueEntry[],
    process(err: unknown, token: string | null): void {
      this.queue.forEach((p) => (err ? p.reject(err) : token && p.resolve(token)));
      this.queue = [];
    },
  };
}

const tenantQueue = makeRefreshQueue();
const platformQueue = makeRefreshQueue();

async function doRefresh(refreshKey: string, endpoint: string): Promise<string> {
  const refreshToken = localStorage.getItem(refreshKey);
  if (!refreshToken) throw new Error("No refresh token");
  const res = await axios.post<{ access_token: string; refresh_token: string }>(
    `${API_BASE_URL}${endpoint}`,
    { refresh_token: refreshToken },
  );
  return res.data.access_token;
}

// ── Factory: build an intercepted axios instance ─────────────────────────────
function buildClient(
  getToken: () => string | null,
  queue: ReturnType<typeof makeRefreshQueue>,
  refreshKey: string,
  refreshEndpoint: string,
  setTokensFn: (access: string, refresh: string) => void,
  clearFn: () => void,
  redirectPath: string,
): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 30_000,
  });

  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const orig = error.config;
      if (!orig) return Promise.reject(error);

      if (error.response?.status === 401 && !("_retry" in orig)) {
        Object.assign(orig, { _retry: true });

        if (queue.isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            queue.queue.push({ resolve, reject });
          }).then((token) => {
            orig.headers.Authorization = `Bearer ${token}`;
            return instance(orig);
          });
        }

        queue.isRefreshing = true;
        try {
          const newToken = await doRefresh(refreshKey, refreshEndpoint);
          const storedRefresh = localStorage.getItem(refreshKey) ?? "";
          setTokensFn(newToken, storedRefresh);
          queue.process(null, newToken);
          orig.headers.Authorization = `Bearer ${newToken}`;
          return instance(orig);
        } catch (refreshErr) {
          queue.process(refreshErr, null);
          clearFn();
          if (typeof window !== "undefined") window.location.href = redirectPath;
          return Promise.reject(refreshErr);
        } finally {
          queue.isRefreshing = false;
        }
      }

      const apiErr = ApiError.fromAxiosError(error as AxiosError<ApiErrorResponse>);
      return Promise.reject(apiErr);
    },
  );

  return instance;
}

export const tenantApiClient: AxiosInstance = buildClient(
  getTenantToken,
  tenantQueue,
  TENANT_REFRESH_KEY,
  "/auth/refresh",
  setTenantTokens,
  clearTenantTokens,
  "/login",
);

export const platformApiClient: AxiosInstance = buildClient(
  getPlatformToken,
  platformQueue,
  PLATFORM_REFRESH_KEY,
  "/auth/refresh",
  setPlatformTokens,
  clearPlatformTokens,
  "/platform-login",
);

// Default export: tenant client (used by most repositories)
export const apiClient = tenantApiClient;

// Shared client for endpoints that accept either platform or tenant JWT
// (AnyAuthUser dependency on the backend). Picks the platform token when
// present, otherwise falls back to the tenant token.
export const anyApiClient = new Proxy({} as AxiosInstance, {
  get(_target, prop) {
    const client = getPlatformToken() ? platformApiClient : tenantApiClient;
    const value = (client as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
}) as AxiosInstance;

export { API_BASE_URL };
