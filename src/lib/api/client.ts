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

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  /** JSON-serializable body for POST. */
  body?: unknown;
  /** Extra fetch init (e.g. signal). */
  init?: RequestInit;
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}/api${cleanPath}`;
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

function getDefaultErrorMessage(status: number): { code: string; message: string } {
  switch (status) {
    case 400:
      return { code: "INVALID_REQUEST", message: "Bad request. Please verify the provided parameters." };
    case 404:
      return { code: "NOT_FOUND", message: "The requested resource was not found." };
    case 409:
      return { code: "CONFLICT", message: "Resource conflict or analysis is still in progress." };
    case 413:
      return { code: "PAYLOAD_TOO_LARGE", message: "The uploaded file is too large." };
    case 422:
      return { code: "UNPROCESSABLE_ENTITY", message: "The request cannot be processed." };
    case 503:
      return { code: "SERVICE_UNAVAILABLE", message: "The service is temporarily unavailable." };
    default:
      return { code: `HTTP_${status}`, message: `Request failed with status ${status}.` };
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, init } = options;
  const url = buildUrl(path);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (networkError) {
    throw new ApiError(0, {
      code: "NETWORK_ERROR",
      message: `Failed to connect to backend at ${url}. Ensure the backend is running.`,
    });
  }

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const nested = (data as { error?: ApiErrorDetail } | null)?.error;
    const fallback = getDefaultErrorMessage(res.status);
    throw new ApiError(res.status, {
      code: nested?.code ?? fallback.code,
      message: nested?.message ?? fallback.message,
      details: nested?.details,
      traceId: nested?.traceId,
    });
  }

  return data as T;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  init?: RequestInit,
): Promise<T> {
  const url = buildUrl(path);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      method: "POST",
      headers: {
        ...(init?.headers ?? {}),
        // Do not set Content-Type so fetch calculates boundary automatically
      },
      body: formData,
    });
  } catch (networkError) {
    throw new ApiError(0, {
      code: "NETWORK_ERROR",
      message: `Failed to connect to backend at ${url}. Ensure the backend is running.`,
    });
  }

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const nested = (data as { error?: ApiErrorDetail } | null)?.error;
    const fallback = getDefaultErrorMessage(res.status);
    throw new ApiError(res.status, {
      code: nested?.code ?? fallback.code,
      message: nested?.message ?? fallback.message,
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

export function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body, init });
}
