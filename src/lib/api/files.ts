import { apiGet } from "./client";
import type {
  FileContentResponse,
  FileDetailResponse,
  FileFilterParams,
  FileItem,
  PagedResult,
  SymbolDetailResponse,
} from "../../types";

/** contracts/api.md Section 19: GET /api/analyses/{id}/files */
export function getFiles(
  analysisId: string,
  filter?: FileFilterParams,
  init?: RequestInit,
): Promise<PagedResult<FileItem>> {
  return apiGet<PagedResult<FileItem>>(
    `/analyses/${analysisId}/files`,
    filter,
    init,
  );
}

/** contracts/api.md Section 20: GET /api/analyses/{id}/files/{fileId} */
export function getFileDetail(
  analysisId: string,
  fileId: string,
  init?: RequestInit,
): Promise<FileDetailResponse> {
  return apiGet<FileDetailResponse>(`/analyses/${analysisId}/files/${fileId}`, undefined, init);
}

/** contracts/api.md Section 21: GET /api/analyses/{id}/files/{fileId}/content */
export function getFileContent(
  analysisId: string,
  fileId: string,
  init?: RequestInit,
): Promise<FileContentResponse> {
  return apiGet<FileContentResponse>(
    `/analyses/${analysisId}/files/${fileId}/content`,
    undefined,
    init,
  );
}

/** contracts/api.md Section 22: GET /api/analyses/{id}/symbols/{symbolId} */
export function getSymbolDetail(
  analysisId: string,
  symbolId: string,
  init?: RequestInit,
): Promise<SymbolDetailResponse> {
  return apiGet<SymbolDetailResponse>(
    `/analyses/${analysisId}/symbols/${symbolId}`,
    undefined,
    init,
  );
}
