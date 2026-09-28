import { apiRequest } from "@/services/api-client";
import type {
  AnalysisSummary,
  ArchitectureResponse,
  ChatRequest,
  ChatResponse,
  CreateAnalysisRequest,
  DependencyItem,
  PagedResult,
  RepositoryOverview,
} from "@/types/api";

const analysisPath = (analysisId: string) =>
  `/api/analyses/${encodeURIComponent(analysisId)}`;

export const analysisApi = {
  createFromGitUrl(request: CreateAnalysisRequest) {
    return apiRequest<AnalysisSummary>("/api/analyses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  },
  createFromZip(file: File) {
    const body = new FormData();
    body.append("repositoryZip", file);
    return apiRequest<AnalysisSummary>("/api/analyses", {
      method: "POST",
      body,
    });
  },
  get(analysisId: string) {
    return apiRequest<AnalysisSummary>(analysisPath(analysisId));
  },
  overview(analysisId: string) {
    return apiRequest<RepositoryOverview>(`${analysisPath(analysisId)}/overview`);
  },
  architecture(analysisId: string) {
    return apiRequest<ArchitectureResponse>(`${analysisPath(analysisId)}/architecture`);
  },
  dependencies(analysisId: string, page = 1, pageSize = 100) {
    const query = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    return apiRequest<PagedResult<DependencyItem>>(
      `${analysisPath(analysisId)}/dependencies?${query}`,
    );
  },
  endpoints(analysisId: string) {
    return apiRequest<unknown[]>(`${analysisPath(analysisId)}/endpoints`);
  },
  database(analysisId: string) {
    return apiRequest<unknown>(`${analysisPath(analysisId)}/database`);
  },
  files(analysisId: string) {
    return apiRequest<unknown[]>(`${analysisPath(analysisId)}/files`);
  },
  evidence(analysisId: string) {
    return apiRequest<unknown[]>(`${analysisPath(analysisId)}/evidence`);
  },
  chat(analysisId: string, request: ChatRequest) {
    return apiRequest<ChatResponse>(`${analysisPath(analysisId)}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  },
};
