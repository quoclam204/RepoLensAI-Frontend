import { apiGet } from "./client";
import type {
  EvidenceDetailResponse,
  EvidenceFilterParams,
  PagedResult,
} from "../../types";

/** contracts/api.md Section 24: GET /api/analyses/{id}/evidence */
export function getEvidenceList(
  analysisId: string,
  filter?: EvidenceFilterParams,
  init?: RequestInit,
): Promise<PagedResult<EvidenceDetailResponse>> {
  return apiGet<PagedResult<EvidenceDetailResponse>>(
    `/analyses/${analysisId}/evidence`,
    filter,
    init,
  );
}

/** contracts/api.md Section 23: GET /api/analyses/{id}/evidence/{evidenceId} */
export function getEvidenceDetail(
  analysisId: string,
  evidenceId: string,
  init?: RequestInit,
): Promise<EvidenceDetailResponse> {
  return apiGet<EvidenceDetailResponse>(
    `/analyses/${analysisId}/evidence/${evidenceId}`,
    undefined,
    init,
  );
}
