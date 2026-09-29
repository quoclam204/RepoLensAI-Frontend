/**
 * Backend configuration read from the environment.
 *
 * Source of truth for the default value:
 * RepoLensAI-Backend/src/RepoLens.Api/Properties/launchSettings.json
 * (http profile -> http://localhost:5237).
 */
export const config = {
  apiBaseUrl: (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5237"
  ).replace(/\/+$/, ""),
} as const;

export function getApiBaseUrl(): string {
  return config.apiBaseUrl || "http://localhost:5237";
}
