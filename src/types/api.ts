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
  projectCount: number;
  symbolCount: number;
  languages: Array<{ name: string; percentage: number }>;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  evidenceId?: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
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
