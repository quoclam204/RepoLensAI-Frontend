export type AnalysisStatus =
  | "Created"
  | "Acquiring"
  | "Scanning"
  | "Analyzing"
  | "Indexing"
  | "Completed"
  | "Failed";

export type ConfidenceLevel = "High" | "Medium" | "Low" | "Unknown";

export interface CreateAnalysisRequest {
  repositoryUrl: string;
}

export type RepositorySubmission =
  | { type: "GitUrl"; repositoryUrl: string }
  | { type: "Zip"; file: File };

export interface AnalysisSummary {
  id: string;
  status: AnalysisStatus;
  repositoryName: string;
  repositoryUrl?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
}

export interface RepositoryOverview {
  repositoryName: string;
  defaultBranch?: string;
  fileCount: number;
  lineCount: number;
  projectCount: number;
  symbolCount: number;
  endpointCount: number;
  databaseEntityCount: number;
  languages: Array<{ name: string; percentage: number }>;
  projects: Array<{ name: string; type: string; fileCount: number }>;
}

export interface ArchitectureNode {
  id: string;
  type: string;
  name: string;
  path: string;
  metadata?: Record<string, unknown> | null;
}

export interface EvidenceSnippet {
  file: string;
  startLine: number;
  endLine: number;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: string;
  evidence?: EvidenceSnippet | null;
  evidenceId?: string;
}

export interface ArchitectureResponse {
  analysisId: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

export interface DependencyNode {
  id: string;
  name: string;
  type: string;
}

export interface DependencyItem {
  id: string;
  source: DependencyNode;
  target: DependencyNode;
  type: string;
  evidenceId?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VisualGraphNode extends Record<string, unknown> {
  id: string;
  label: string;
  kind: string;
  path?: string;
  metadata?: Record<string, unknown> | null;
}

export interface VisualGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  confidence?: string;
  evidence?: EvidenceSnippet | null;
  evidenceId?: string | null;
}

export interface VisualGraph {
  nodes: VisualGraphNode[];
  edges: VisualGraphEdge[];
  totalRelationships: number;
}

export interface EvidenceReference {
  id: string;
  filePath: string;
  symbol?: string;
  startLine?: number;
  endLine?: number;
}

export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
  confidence: ConfidenceLevel;
  evidence: EvidenceReference[];
}
