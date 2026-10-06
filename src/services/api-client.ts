const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function hasBackendConfiguration() {
  return API_BASE_URL.length > 0;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      "NEXT_PUBLIC_API_BASE_URL is not configured. Use the mock adapter during independent frontend development.",
      0,
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.error?.message) {
        message = parsed.error.message;
      } else if (parsed.errors && typeof parsed.errors === "object") {
        message = Object.values(parsed.errors).flat().join(" ");
      } else if (parsed.title) {
        message = parsed.title;
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiError(message || `Backend returned HTTP ${response.status}.`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
