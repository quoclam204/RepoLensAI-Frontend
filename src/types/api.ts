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
  sourceType?: string;
  sourceLocation?: string;
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

export interface ExplorerQuery {
  page?: number;
  pageSize?: number;
}

export interface EndpointQuery extends ExplorerQuery {
  method?: string;
  route?: string;
  projectId?: string;
  controller?: string;
}

export interface ProjectReference {
  id: string;
  name: string;
}

export interface EndpointItem {
  id: string;
  method: string;
  route: string;
  project: ProjectReference;
  controller?: string | null;
  action?: string | null;
  symbolId?: string | null;
  evidenceId?: string | null;
}

export interface DetailEvidenceSnippet extends EvidenceSnippet {
  reason: string;
}

export interface EndpointDetail {
  id: string;
  method: string;
  route: string;
  controller?: string | null;
  action?: string | null;
  project: string;
  source: { file: string; symbol?: string | null };
  evidence: DetailEvidenceSnippet[];
}

export interface EntityProperty {
  name: string;
  type: string;
  nullable: boolean;
}

export interface DatabaseRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: string;
  confidence: string;
  evidenceId?: string | null;
}

export interface DatabaseEntity {
  id: string;
  name: string;
  type: string;
  sourceSymbolId?: string | null;
  properties: EntityProperty[];
}

export interface DatabaseModel {
  entities: DatabaseEntity[];
  relationships: DatabaseRelationship[];
}

export interface DatabaseEntityDetail {
  id: string;
  name: string;
  type: string;
  source?: { file: string; symbol: string } | null;
  properties: EntityProperty[];
  relationships: DatabaseRelationship[];
  evidence: DetailEvidenceSnippet[];
}

export interface FileQuery extends ExplorerQuery {
  path?: string;
  language?: string;
  projectId?: string;
  search?: string;
}

export interface FileItem {
  id: string;
  path: string;
  language: string;
  projectId: string;
  size: number;
  analysisStatus: string;
}

export interface FileSymbol {
  id: string;
  name: string;
  fullName: string;
  type: string;
  startLine: number;
  endLine: number;
}

export interface FileDetail {
  id: string;
  path: string;
  language: string;
  projectId: string;
  size: number;
  symbols: FileSymbol[];
}

export interface FileContent {
  fileId: string;
  path: string;
  language: string;
  content: string;
  lineCount: number;
}

export interface SymbolDetail extends FileSymbol {
  file: { id: string; path: string };
  relationships: Array<{ type: string; targetSymbolId: string }>;
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
  description?: string;
}

export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
  confidence: ConfidenceLevel;
  evidence: EvidenceReference[];
}

export interface ArchifyV3Component {
  id: string;
  type: string;
  label: string;
  sublabel?: string;
  tag?: string;
  icon?: string;
  category?: string;
  sources?: string[];
}

export interface ArchifyV3Boundary {
  id: string;
  kind: string;
  label: string;
  category?: string;
  wraps: string[];
}

export interface ArchifyV3Connection {
  id: string;
  from: string;
  to: string;
  label?: string;
  variant?: string;
  evidenceId?: string;
  confidence?: string;
}

export interface ArchifyV3Document {
  schema_version: number;
  diagram_type: string;
  meta: {
    title: string;
    subtitle?: string;
    animation?: string;
    quality_profile?: string;
  };
  components: ArchifyV3Component[];
  boundaries: ArchifyV3Boundary[];
  connections: ArchifyV3Connection[];
}

export interface ArchitectureTraceResponse {
  analysisId: string;
  fromNodeId: string;
  toNodeId: string;
  found: boolean;
  pathNodes: ArchitectureNode[];
  pathEdges: ArchitectureEdge[];
  evidences: EvidenceSnippet[];
}

export type RepositoryType =
  | "ApiBackend"
  | "Frontend"
  | "Monorepo"
  | "Library"
  | "Cli"
  | "Unsupported";

export interface ClassificationEvidence {
  filePath: string;
  reason: string;
  layer: number;
}

export interface RepositoryClassification {
  type: RepositoryType;
  detectedLanguages: string[];
  confidence: ConfidenceLevel;
  evidences: ClassificationEvidence[];
  summary: string;
}

export interface DiagramNodeDto {
  id: string;
  label: string;
  kind: string;
  role: string;
  parentId?: string | null;
  evidence: string[];
  childDiagramType?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface DiagramEdgeDto {
  id: string;
  from: string;
  to: string;
  kind: string;
  label?: string | null;
  confidence: string;
  isInferred: boolean;
}

export interface DiagramDetailCardDto {
  nodeId: string;
  title: string;
  role: string;
  filePath?: string | null;
  symbol?: string | null;
  lineRange?: string | null;
  description?: string | null;
  summary?: string | null;
  upstreamNodes: string[];
  downstreamNodes: string[];
}

export interface DiagramDto {
  diagramType: string;
  repositoryType: RepositoryType;
  status: "Success" | "NotDetected" | "Unsupported";
  message?: string | null;
  databaseDetected: boolean;
  availableDiagramTypes: string[];
  nodes: DiagramNodeDto[];
  edges: DiagramEdgeDto[];
  detailCards: DiagramDetailCardDto[];
}


