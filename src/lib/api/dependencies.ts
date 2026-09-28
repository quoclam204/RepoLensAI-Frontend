import { apiGet } from "./client";
import type {
  DependencyDetailResponse,
  DependencyFilterParams,
  DependencyItem,
  PagedResult,
} from "../../types";

/** contracts/api.md Section 13: GET /api/analyses/{id}/dependencies */
export function getDependencies(
  analysisId: string,
  filter?: DependencyFilterParams,
  init?: RequestInit,
): Promise<PagedResult<DependencyItem>> {
  return apiGet<PagedResult<DependencyItem>>(
    `/analyses/${analysisId}/dependencies`,
    filter,
    init,
  );
}

/** contracts/api.md Section 14: GET /api/analyses/{id}/dependencies/{dependencyId} */
export function getDependencyDetail(
  analysisId: string,
  dependencyId: string,
  init?: RequestInit,
): Promise<DependencyDetailResponse> {
  return apiGet<DependencyDetailResponse>(
    `/analyses/${analysisId}/dependencies/${dependencyId}`,
    undefined,
    init,
  );
}
