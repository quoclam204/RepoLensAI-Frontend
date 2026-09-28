import { apiGet } from "./client";
import type { ArchitectureResponse } from "../../types";

/** contracts/api.md Section 10: GET /api/analyses/{id}/architecture */
export function getArchitecture(
  analysisId: string,
  init?: RequestInit,
): Promise<ArchitectureResponse> {
  return apiGet<ArchitectureResponse>(`/analyses/${analysisId}/architecture`, undefined, init);
}
