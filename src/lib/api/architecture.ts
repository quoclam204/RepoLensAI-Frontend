import { apiGet } from "./client";
import type { ArchitectureResponse, ArchifyDocument } from "../../types";

/** contracts/api.md Section 10: GET /api/analyses/{id}/architecture */
export function getArchitecture(
  analysisId: string,
  init?: RequestInit,
): Promise<ArchitectureResponse> {
  return apiGet<ArchitectureResponse>(`/analyses/${analysisId}/architecture`, undefined, init);
}

/** Archify C4 Model: GET /api/analyses/{id}/architecture/archify */
export function getArchifyArchitecture(
  analysisId: string,
  init?: RequestInit,
): Promise<ArchifyDocument> {
  return apiGet<ArchifyDocument>(`/analyses/${analysisId}/architecture/archify`, undefined, init);
}
