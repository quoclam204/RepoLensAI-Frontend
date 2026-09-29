import { apiRequest } from "@/services/api-client";
import type {
  AnalysisSummary,
  ArchitectureResponse,
  ChatRequest,
  ChatResponse,
  CreateAnalysisRequest,
  DependencyItem,
  DatabaseEntityDetail,
  DatabaseModel,
  EndpointDetail,
  EndpointItem,
  EndpointQuery,
  FileContent,
  FileDetail,
  FileItem,
  FileQuery,
  PagedResult,
  RepositoryOverview,
  SymbolDetail,
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
  endpoints(analysisId: string, filters: EndpointQuery = {}) {
    return apiRequest<PagedResult<EndpointItem>>(
      `${analysisPath(analysisId)}/endpoints?${toQuery(filters)}`,
    );
  },
  endpointDetail(analysisId: string, endpointId: string) {
    return apiRequest<EndpointDetail>(
      `${analysisPath(analysisId)}/endpoints/${encodeURIComponent(endpointId)}`,
    );
  },
  database(analysisId: string) {
    return apiRequest<DatabaseModel>(`${analysisPath(analysisId)}/database`);
  },
  databaseEntity(analysisId: string, entityId: string) {
    return apiRequest<DatabaseEntityDetail>(
      `${analysisPath(analysisId)}/database/entities/${encodeURIComponent(entityId)}`,
    );
  },
  files(analysisId: string, filters: FileQuery = {}) {
    return apiRequest<PagedResult<FileItem>>(
      `${analysisPath(analysisId)}/files?${toQuery(filters)}`,
    );
  },
  fileDetail(analysisId: string, fileId: string) {
    return apiRequest<FileDetail>(
      `${analysisPath(analysisId)}/files/${encodeURIComponent(fileId)}`,
    );
  },
  fileContent(analysisId: string, fileId: string) {
    return apiRequest<FileContent>(
      `${analysisPath(analysisId)}/files/${encodeURIComponent(fileId)}/content`,
    );
  },
  symbolDetail(analysisId: string, symbolId: string) {
    return apiRequest<SymbolDetail>(
      `${analysisPath(analysisId)}/symbols/${encodeURIComponent(symbolId)}`,
    );
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

function toQuery(filters: object) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return query;
}
