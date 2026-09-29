import { apiGet, apiPost, apiUpload } from "./client";
import type {
  AnalysisOverviewResponse,
  AnalysisStatusResponse,
  CreateAnalysisGitRequest,
  CreateAnalysisResponse,
} from "../../types";

/** contracts/api.md Section 6: POST /api/analyses */
export function createAnalysisFromGit(
  request: CreateAnalysisGitRequest,
  init?: RequestInit,
): Promise<CreateAnalysisResponse> {
  return apiPost<CreateAnalysisResponse>("/analyses", request, init);
}

/** contracts/api.md Section 6.2: POST /api/analyses/upload */
export function uploadAnalysisZip(
  file: File,
  init?: RequestInit,
): Promise<CreateAnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<CreateAnalysisResponse>("/analyses/upload", formData, init);
}

/** contracts/api.md Section 7: GET /api/analyses/{id} */
export function getAnalysisStatus(
  analysisId: string,
  init?: RequestInit,
): Promise<AnalysisStatusResponse> {
  return apiGet<AnalysisStatusResponse>(`/analyses/${analysisId}`, undefined, init);
}

/** contracts/api.md Section 9: GET /api/analyses/{id}/overview */
export function getAnalysisOverview(
  analysisId: string,
  init?: RequestInit,
): Promise<AnalysisOverviewResponse> {
  return apiGet<AnalysisOverviewResponse>(`/analyses/${analysisId}/overview`, undefined, init);
}
