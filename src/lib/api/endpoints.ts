import { apiGet } from "./client";
import type {
  EndpointDetailResponse,
  EndpointFilterParams,
  EndpointItem,
  PagedResult,
} from "../../types";

/** contracts/api.md Section 15: GET /api/analyses/{id}/endpoints */
export function getEndpoints(
  analysisId: string,
  filter?: EndpointFilterParams,
  init?: RequestInit,
): Promise<PagedResult<EndpointItem>> {
  return apiGet<PagedResult<EndpointItem>>(
    `/analyses/${analysisId}/endpoints`,
    filter,
    init,
  );
}

/** contracts/api.md Section 16: GET /api/analyses/{id}/endpoints/{endpointId} */
export function getEndpointDetail(
  analysisId: string,
  endpointId: string,
  init?: RequestInit,
): Promise<EndpointDetailResponse> {
  return apiGet<EndpointDetailResponse>(
    `/analyses/${analysisId}/endpoints/${endpointId}`,
    undefined,
    init,
  );
}
