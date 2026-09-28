/**
 * Shared backend contract types.
 *
 * Source of truth: RepoLensAI-Backend/specs/001-repolens-mvp/contracts/api.md
 * and the DTOs under RepoLensAI-Backend/src/RepoLens.Application/DTOs.
 * JSON uses camelCase (see RepoLens.Api Program.cs JsonNamingPolicy).
 */

// --- Common envelopes (contracts/api.md Sections 4, 32) ---

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
  traceId?: string | null;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Analysis status values (contracts/api.md Section 8). */
export type AnalysisStatus =
  | "Created"
  | "Cloning"
  | "Scanning"
  | "Analyzing"
  | "Indexing"
  | "Completed"
  | "Failed";

// --- Analyses (contracts/api.md Sections 6, 7, 9) ---

export type RepositorySourceType = "GitUrl" | "ZipUpload";

export interface CreateAnalysisGitRequest {
  sourceType: "GitUrl";
  sourceUrl: string;
}

export interface CreateAnalysisResponse {
  analysisId: string;
  repositoryId: string;
  status: string;
  createdAt: string;
}

export interface AnalysisStatusResponse {
  id: string;
  repositoryId: string;
  status: string;
  stage: string;
  progress: number;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface AnalysisOverviewResponse {
  analysisId: string;
  repository: {
    name: string;
    sourceType: string;
    sourceUrl: string;
    commitHash: string | null;
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
}

// --- Architecture (contracts/api.md Sections 10-12) ---

export interface ArchitectureResponse {
  analysisId: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

export interface ArchitectureNode {
  id: string;
  type: string;
  name: string;
  path: string;
  metadata?: unknown;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: string;
  evidence?: { file: string; startLine: number; endLine: number } | null;
  evidenceId?: string | null;
}

// --- Dependencies (contracts/api.md Sections 13-14) ---

export interface DependencyItem {
  id: string;
  source: { id: string; name: string; type: string };
  target: { id: string; name: string; type: string };
  type: string;
  evidenceId?: string | null;
}

export interface DependencyDetailResponse {
  id: string;
  type: string;
  source: { id: string; name: string };
  target: { id: string; name: string };
  evidence: Array<{
    id: string;
    file: string;
    startLine: number;
    endLine: number;
    description: string;
  }>;
}

export interface DependencyFilterParams {
  projectId?: string;
  type?: string;
  direction?: string;
  page?: number;
  pageSize?: number;
}

// --- Endpoints (contracts/api.md Sections 15-16) ---

export interface EndpointItem {
  id: string;
  method: string;
  route: string;
  project: { id: string; name: string };
  controller?: string | null;
  action?: string | null;
  symbolId?: string | null;
  evidenceId?: string | null;
}

export interface EndpointDetailResponse {
  id: string;
  method: string;
  route: string;
  controller?: string | null;
  action?: string | null;
  project: string;
  source: { file: string; symbol?: string | null };
  evidence: EndpointEvidenceSnippet[];
}

export interface EndpointEvidenceSnippet {
  file: string;
  startLine: number;
  endLine: number;
  reason: string;
}

export interface EndpointFilterParams {
  method?: string;
  route?: string;
  projectId?: string;
  controller?: string;
  page?: number;
  pageSize?: number;
}

// --- Database (contracts/api.md Sections 17-18) ---

export interface DatabaseModelResponse {
  entities: DatabaseEntity[];
  relationships: DatabaseRelationship[];
}

export interface DatabaseEntity {
  id: string;
  name: string;
  type: string;
  sourceSymbolId?: string | null;
  properties: Array<{ name: string; type: string; nullable: boolean }>;
}

export interface DatabaseRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: string;
  confidence: string;
  evidenceId?: string | null;
}

export interface DatabaseEntityDetailResponse {
  id: string;
  name: string;
  type: string;
  source?: { file: string; symbol: string } | null;
  properties: Array<{ name: string; type: string; nullable: boolean }>;
  relationships: DatabaseRelationship[];
  evidence: Array<{
    file: string;
    startLine: number;
    endLine: number;
    reason: string;
  }>;
}

// --- Files (contracts/api.md Sections 19-21) ---

export interface FileItem {
  id: string;
  path: string;
  language: string;
  projectId: string;
  size: number;
  analysisStatus: string;
}

export interface FileDetailResponse {
  id: string;
  path: string;
  language: string;
  projectId: string;
  size: number;
  symbols: Array<{
    id: string;
    name: string;
    fullName: string;
    type: string;
    startLine: number;
    endLine: number;
  }>;
}

export interface FileContentResponse {
  fileId: string;
  path: string;
  language: string;
  content: string;
  lineCount: number;
}

export interface FileFilterParams {
  path?: string;
  language?: string;
  projectId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// --- Symbols (contracts/api.md Section 22) ---

export interface SymbolDetailResponse {
  id: string;
  name: string;
  fullName: string;
  type: string;
  file: { id: string; path: string };
  startLine: number;
  endLine: number;
  relationships: Array<{ type: string; targetSymbolId: string }>;
}

// --- Evidence (contracts/api.md Sections 23-24) ---

export interface EvidenceDetailResponse {
  id: string;
  analysisId: string;
  filePath: string;
  symbol?: string | null;
  startLine: number;
  endLine: number;
  evidenceType: string;
  description: string;
}

export interface EvidenceFilterParams {
  filePath?: string;
  symbol?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

// --- Chat (contracts/api.md Sections 25-29) ---

export interface ChatRequest {
  question: string;
}

/** Allowed values: contracts/api.md Section 27. Never a probability. */
export type ChatConfidence = "high" | "medium" | "low" | "unknown";

export interface ChatEvidenceItem {
  file: string;
  symbol?: string | null;
  startLine: number;
  endLine: number;
  reason?: string | null;
}

export interface ChatResponse {
  answer: string;
  confidence: ChatConfidence;
  evidence: ChatEvidenceItem[];
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  evidence?: ChatEvidenceItem[];
}
