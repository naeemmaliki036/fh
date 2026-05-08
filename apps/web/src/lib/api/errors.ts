import type { AxiosError } from "axios";

export interface ApiErrorResponse {
  detail?: string | Array<{ msg: string; loc?: string[]; type?: string }>;
  message?: string;
  [key: string]: unknown;
}

const PENDING_APPROVAL_MSG = "Tenant account is pending approval";
const SUSPENDED_MSG = "Tenant account is suspended";

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  /** Raw response body fields beyond `detail` — useful for conflict responses (409). */
  public readonly extras: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    code = "UNKNOWN_ERROR",
    extras: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.extras = extras;
  }

  static fromAxiosError(error: AxiosError<ApiErrorResponse>): ApiError {
    const status = error.response?.status ?? 500;
    const data = error.response?.data ?? {};
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((e) => (e as { msg: string }).msg).join(", ")
      : (detail as string | undefined) ?? (data.message as string | undefined) ?? error.message ?? "An unexpected error occurred";
    const code =
      status === 401
        ? "UNAUTHORIZED"
        : status === 409
          ? "CONFLICT"
          : status === 403 && message === PENDING_APPROVAL_MSG
            ? "PENDING_APPROVAL"
            : status === 403 && message === SUSPENDED_MSG
              ? "SUSPENDED"
              : status === 403
                ? "FORBIDDEN"
                : "API_ERROR";

    // Capture all response body fields except `detail` as extras
    const extras: Record<string, unknown> = Object.fromEntries(
      Object.entries(data).filter(([k]) => k !== "detail" && k !== "message"),
    );
    return new ApiError(message, status, code, extras);
  }

  get isUnauthorized(): boolean { return this.status === 401; }
  get isForbidden(): boolean { return this.status === 403; }
  get isNotFound(): boolean { return this.status === 404; }
  get isConflict(): boolean { return this.status === 409; }
  get isServerError(): boolean { return this.status >= 500; }
  get isPendingApproval(): boolean { return this.code === "PENDING_APPROVAL"; }
  get isSuspended(): boolean { return this.code === "SUSPENDED"; }
}
