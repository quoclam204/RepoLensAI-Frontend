import { apiGet } from "./client";
import type {
  DatabaseEntityDetailResponse,
  DatabaseModelResponse,
} from "../../types";

/** contracts/api.md Section 17: GET /api/analyses/{id}/database */
export function getDatabaseModel(
  analysisId: string,
  init?: RequestInit,
): Promise<DatabaseModelResponse> {
  return apiGet<DatabaseModelResponse>(`/analyses/${analysisId}/database`, undefined, init);
}

/** contracts/api.md Section 18: GET /api/analyses/{id}/database/entities/{entityId} */
export function getDatabaseEntityDetail(
  analysisId: string,
  entityId: string,
  init?: RequestInit,
): Promise<DatabaseEntityDetailResponse> {
  return apiGet<DatabaseEntityDetailResponse>(
    `/analyses/${analysisId}/database/entities/${entityId}`,
    undefined,
    init,
  );
}
