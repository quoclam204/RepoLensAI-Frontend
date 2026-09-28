/**
 * Backend configuration read from the environment.
 *
 * Source of truth for the default value:
 * RepoLensAI-Backend/src/RepoLens.Api/Properties/launchSettings.json
 * (http profile -> http://localhost:5237).
 */
export const config = {
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, ""),
} as const;

export function getApiBaseUrl(): string {
  if (!config.apiBaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env.local and set it.",
    );
  }
  return config.apiBaseUrl;
}
