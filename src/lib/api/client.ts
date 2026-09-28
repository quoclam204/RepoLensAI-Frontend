import { getApiBaseUrl } from "../../config";
import type { ApiErrorDetail } from "../../types";

/**
 * Normalized API error thrown by the shared client.
 * Mirrors contracts/api.md Section 4 ({ error: { code, message, details?, traceId? } }).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly traceId?: string | null;

  constructor(status: number, error: ApiErrorDetail) {
    super(error.message);
    this.name = "ApiError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
    this.traceId = error.traceId;
  }
}

export type HttpMethod = "GET" | "POST";

interface RequestOptions {
  method?: HttpMethod;
  /** JSON-serializable body for POST. */
  body?: unknown;
  /** Extra fetch init (e.g. signal). */
  init?: RequestInit;
}

function buildUrl(path: string): string {
  return `${getApiBaseUrl()}/api${path.startsWith("/") ? path : `/${path}`}`;
}

function buildQuery(query?: object): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, init } = options;
  const res = await fetch(buildUrl(path), {
    ...init,
    method,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const nested = (data as { error?: ApiErrorDetail } | null)?.error;
    throw new ApiError(res.status, {
      code: nested?.code ?? `HTTP_${res.status}`,
      message: nested?.message ?? `Request failed with status ${res.status}.`,
      details: nested?.details,
      traceId: nested?.traceId,
    });
  }

  return data as T;
}

export function apiGet<T>(
  path: string,
  query?: object,
  init?: RequestInit,
): Promise<T> {
  return apiRequest<T>(`${path}${buildQuery(query)}`, { init });
}

export function apiPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body, init });
}
