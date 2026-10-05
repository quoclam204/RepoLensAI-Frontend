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
  async createFromGitUrl(request: CreateAnalysisRequest): Promise<AnalysisSummary> {
    const data = await apiRequest<{
      analysisId: string;
      repositoryId: string;
      status: string;
      createdAt: string;
    }>("/api/analyses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType: "GitUrl",
        sourceUrl: request.repositoryUrl,
      }),
    });
    return {
      id: data.analysisId,
      status: data.status as AnalysisSummary["status"],
      repositoryName: request.repositoryUrl.split("/").filter(Boolean).pop()?.replace(/\.git$/i, "") || "Git Repository",
      repositoryUrl: request.repositoryUrl,
      progress: 0,
      createdAt: data.createdAt,
      updatedAt: data.createdAt,
    };
  },
  async createFromZip(file: File): Promise<AnalysisSummary> {
    const body = new FormData();
    body.append("file", file);
    const data = await apiRequest<{
      analysisId: string;
      repositoryId: string;
      status: string;
      createdAt: string;
    }>("/api/analyses/upload", {
      method: "POST",
      body,
    });
    return {
      id: data.analysisId,
      status: data.status as AnalysisSummary["status"],
      repositoryName: file.name.replace(/\.zip$/i, "") || "Uploaded repository",
      progress: 0,
      createdAt: data.createdAt,
      updatedAt: data.createdAt,
    };
  },
  async get(analysisId: string): Promise<AnalysisSummary> {
    const data = await apiRequest<{
      id: string;
      repositoryId: string;
      status: string;
      stage: string;
      progress: number;
      startedAt: string;
      completedAt?: string | null;
      error?: string | null;
    }>(analysisPath(analysisId));

    return {
      id: data.id,
      status: data.status as AnalysisSummary["status"],
      repositoryName: "Repository",
      progress: data.progress ?? 0,
      createdAt: data.startedAt,
      updatedAt: data.completedAt ?? data.startedAt,
      failureReason: data.error ?? undefined,
    };
  },
  async overview(analysisId: string): Promise<RepositoryOverview> {
    const data = await apiRequest<{
      analysisId: string;
      repository: {
        name: string;
        sourceType: string;
        sourceUrl: string;
        commitHash?: string | null;
      };
      statistics: {
        projects: number;
        sourceFiles: number;
        symbols: number;
        dependencies: number;
        apiEndpoints: number;
        databaseEntities: number;
      };
      languages: Array<{
        name: string;
        fileCount: number;
        percentage: number;
        support: string;
      }>;
    }>(`${analysisPath(analysisId)}/overview`);

    return {
      repositoryName: data.repository?.name || "Repository",
      defaultBranch: data.repository?.commitHash || "main",
      fileCount: data.statistics?.sourceFiles ?? 0,
      lineCount: 0,
      projectCount: data.statistics?.projects ?? 0,
      symbolCount: data.statistics?.symbols ?? 0,
      endpointCount: data.statistics?.apiEndpoints ?? 0,
      databaseEntityCount: data.statistics?.databaseEntities ?? 0,
      languages: (data.languages || []).map((l) => ({
        name: l.name,
        percentage: l.percentage,
      })),
      projects: [],
    };
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
