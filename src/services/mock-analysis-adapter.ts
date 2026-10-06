import type {
  AnalysisStatus,
  AnalysisSummary,
  ChatRequest,
  ChatResponse,
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
  RepositorySubmission,
  SymbolDetail,
  VisualGraph,
} from "@/types/api";

const STORAGE_KEY = "repolens.mock.analyses";
const stages: Array<{ status: AnalysisStatus; startsAt: number; progress: number }> = [
  { status: "Created", startsAt: 0, progress: 5 },
  { status: "Acquiring", startsAt: 1500, progress: 20 },
  { status: "Scanning", startsAt: 3500, progress: 42 },
  { status: "Analyzing", startsAt: 6000, progress: 65 },
  { status: "Indexing", startsAt: 9000, progress: 86 },
  { status: "Completed", startsAt: 12000, progress: 100 },
];

interface StoredAnalysis {
  id: string;
  repositoryName: string;
  repositoryUrl?: string;
  createdAt: string;
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function readStore(): StoredAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as StoredAnalysis[];
  } catch {
    return [];
  }
}

function writeStore(records: StoredAnalysis[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function repositoryName(submission: RepositorySubmission) {
  if (submission.type === "Zip") {
    return submission.file.name.replace(/\.zip$/i, "") || "Uploaded repository";
  }
  const segments = new URL(submission.repositoryUrl).pathname
    .replace(/\.git$/i, "")
    .split("/")
    .filter(Boolean);
  return segments.at(-1) ?? "Git repository";
}

function fallbackRecord(id: string): StoredAnalysis {
  return {
    id,
    repositoryName: id === "demo-analysis" ? "RepoLensAI" : "Repository analysis",
    repositoryUrl:
      id === "demo-analysis"
        ? "https://github.com/quoclam204/RepoLensAI-Backend"
        : undefined,
    createdAt: new Date(Date.now() - 15000).toISOString(),
  };
}

function toSummary(record: StoredAnalysis): AnalysisSummary {
  const elapsed = Date.now() - new Date(record.createdAt).getTime();
  const stage = stages.reduce((current, candidate) =>
    elapsed >= candidate.startsAt ? candidate : current,
  );
  return {
    ...record,
    status: stage.status,
    progress: stage.progress,
    updatedAt: new Date().toISOString(),
  };
}

const demoGraph: VisualGraph = {
  nodes: [
    // 01 / User Interface
    { id: "user", label: "User", kind: "User Interface", path: "src/Client", metadata: { projectType: "asks for work", language: "TypeScript" } },
    { id: "chat", label: "Chat Surface", kind: "User Interface", path: "src/Client/Chat", metadata: { projectType: "thread + files", language: "TypeScript" } },
    { id: "final-reply", label: "Final Reply", kind: "User Interface", path: "src/Client/Output", metadata: { projectType: "answer + changes", language: "TypeScript" } },
    // 02 / Agent Runtime
    { id: "planner", label: "Agent Planner", kind: "Agent Runtime", path: "src/RepoLens.Application/Planner", metadata: { projectType: "plan next step", language: "C#" } },
    { id: "router", label: "Tool Router", kind: "Agent Runtime", path: "src/RepoLens.Application/Router", metadata: { projectType: "choose capability", language: "C#" } },
    // EX / Policy & Recovery
    { id: "approval", label: "Approval Gate", kind: "Policy Gate", path: "src/RepoLens.Application/Security", metadata: { projectType: "scope + consent", language: "C#" } },
    { id: "blocked", label: "Blocked", kind: "Policy Gate", path: "src/RepoLens.Application/Security", metadata: { projectType: "wait or reject", language: "C#" } },
    { id: "retry", label: "Retry Path", kind: "Policy Gate", path: "src/RepoLens.Application/Recovery", metadata: { projectType: "revise request", language: "C#" } },
    { id: "tool-call", label: "Tool Call", kind: "Tool Work", path: "src/RepoLens.Infrastructure/Tools", metadata: { projectType: "shell / browser / MCP", language: "C#" } },
    { id: "external-api", label: "External API", kind: "External Service", path: "src/RepoLens.Infrastructure/Network", metadata: { projectType: "network service", language: "C#" } },
    { id: "trace-log", label: "Trace Log", kind: "Trace & Memory", path: "src/RepoLens.Infrastructure/Logs", metadata: { projectType: "events + output", language: "C#" } },
  ],
  edges: [
    { id: "e-user-chat", source: "user", target: "chat", relationship: "asks", confidence: "confirmed" },
    { id: "e-chat-planner", source: "chat", target: "planner", relationship: "plan", confidence: "confirmed" },
    { id: "e-planner-router", source: "planner", target: "router", relationship: "dispatch", confidence: "confirmed" },
    { id: "e-router-approval", source: "router", target: "approval", relationship: "needs approval?", confidence: "confirmed" },
    { id: "e-approval-blocked", source: "approval", target: "blocked", relationship: "denied", confidence: "confirmed" },
    { id: "e-blocked-retry", source: "blocked", target: "retry", relationship: "revise", confidence: "confirmed" },
    { id: "e-approval-tool", source: "approval", target: "tool-call", relationship: "approved", confidence: "confirmed" },
    { id: "e-tool-api", source: "tool-call", target: "external-api", relationship: "invoke", confidence: "confirmed" },
    { id: "e-tool-trace", source: "tool-call", target: "trace-log", relationship: "record result", confidence: "confirmed" },
    { id: "e-trace-planner", source: "trace-log", target: "planner", relationship: "trace + memory", confidence: "confirmed" },
    { id: "e-router-final", source: "router", target: "final-reply", relationship: "complete", confidence: "confirmed" },
  ],
  totalRelationships: 11,
};

const demoEndpoints: EndpointItem[] = [
  { id: "endpoint-analyses", method: "POST", route: "/api/analyses", project: { id: "api", name: "RepoLens.Api" }, controller: "AnalysesController", action: "CreateAnalysis", symbolId: "symbol-create", evidenceId: "evidence-create" },
  { id: "endpoint-architecture", method: "GET", route: "/api/analyses/{id}/architecture", project: { id: "api", name: "RepoLens.Api" }, controller: "ArchitectureController", action: "GetArchitecture", symbolId: "symbol-architecture", evidenceId: "evidence-architecture" },
  { id: "endpoint-files", method: "GET", route: "/api/analyses/{id}/files", project: { id: "api", name: "RepoLens.Api" }, controller: "FilesController", action: "GetFiles", symbolId: "symbol-files", evidenceId: "evidence-files" },
];

const demoDatabase: DatabaseModel = {
  entities: [
    { id: "entity-analysis", name: "Analysis", type: "Entity", sourceSymbolId: "symbol-analysis", properties: [{ name: "Id", type: "Guid", nullable: false }, { name: "Status", type: "AnalysisStatus", nullable: false }, { name: "RepositoryUrl", type: "string", nullable: true }] },
    { id: "entity-project", name: "Project", type: "Entity", sourceSymbolId: "symbol-project", properties: [{ name: "Id", type: "Guid", nullable: false }, { name: "AnalysisId", type: "Guid", nullable: false }, { name: "Name", type: "string", nullable: false }] },
    { id: "entity-source-file", name: "SourceFile", type: "Entity", sourceSymbolId: "symbol-source-file", properties: [{ name: "Id", type: "Guid", nullable: false }, { name: "ProjectId", type: "Guid", nullable: false }, { name: "Path", type: "string", nullable: false }] },
  ],
  relationships: [
    { id: "rel-analysis-project", sourceEntityId: "entity-analysis", targetEntityId: "entity-project", type: "OneToMany", confidence: "confirmed", evidenceId: "evidence-analysis-project" },
    { id: "rel-project-file", sourceEntityId: "entity-project", targetEntityId: "entity-source-file", type: "OneToMany", confidence: "confirmed", evidenceId: "evidence-project-file" },
  ],
};

const demoFiles: FileItem[] = [
  { id: "file-analyses", path: "src/RepoLens.Api/Controllers/AnalysesController.cs", language: "C#", projectId: "api", size: 4821, analysisStatus: "Completed" },
  { id: "file-architecture", path: "src/RepoLens.Api/Controllers/ArchitectureController.cs", language: "C#", projectId: "api", size: 2360, analysisStatus: "Completed" },
  { id: "file-api-types", path: "src/types/api.ts", language: "TypeScript", projectId: "frontend", size: 6210, analysisStatus: "Completed" },
];

function paginate<T>(items: T[], page = 1, pageSize = 50): PagedResult<T> {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  return {
    items: items.slice((safePage - 1) * safeSize, safePage * safeSize),
    totalCount: items.length,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.ceil(items.length / safeSize),
  };
}

export const mockAnalysisAdapter = {
  async create(submission: RepositorySubmission) {
    await wait(500);
    const record: StoredAnalysis = {
      id: `analysis-${crypto.randomUUID().slice(0, 8)}`,
      repositoryName: repositoryName(submission),
      repositoryUrl: submission.type === "GitUrl" ? submission.repositoryUrl : undefined,
      createdAt: new Date().toISOString(),
    };
    writeStore([...readStore(), record]);
    return toSummary(record);
  },
  async get(id: string) {
    await wait(240);
    const record = readStore().find((item) => item.id === id) ?? fallbackRecord(id);
    return toSummary(record);
  },
  async overview(id: string): Promise<RepositoryOverview> {
    await wait(320);
    const record = readStore().find((item) => item.id === id) ?? fallbackRecord(id);
    return {
      repositoryName: record.repositoryName,
      defaultBranch: "main",
      fileCount: 1284,
      lineCount: 146820,
      projectCount: 5,
      symbolCount: 3761,
      endpointCount: 42,
      databaseEntityCount: 18,
      languages: [
        { name: "C#", percentage: 64 },
        { name: "TypeScript", percentage: 28 },
        { name: "Other", percentage: 8 },
      ],
      projects: [
        { name: "RepoLens.Api", type: "ASP.NET Core", fileCount: 124 },
        { name: "RepoLens.Application", type: "Class Library", fileCount: 186 },
        { name: "RepoLens.Domain", type: "Class Library", fileCount: 98 },
        { name: "RepoLens.Infrastructure", type: "Class Library", fileCount: 142 },
        { name: "RepoLens.Analysis", type: "Analyzer", fileCount: 211 },
      ],
    };
  },
  async architecture() {
    await wait(280);
    return demoGraph;
  },
  async dependencies() {
    await wait(280);
    return demoGraph;
  },
  async endpoints(filters: EndpointQuery = {}) {
    await wait(260);
    const method = filters.method?.toLowerCase();
    const route = filters.route?.toLowerCase();
    const items = demoEndpoints.filter((endpoint) =>
      (!method || endpoint.method.toLowerCase() === method) &&
      (!route || endpoint.route.toLowerCase().includes(route)),
    );
    return paginate(items, filters.page, filters.pageSize);
  },
  async endpointDetail(endpointId: string): Promise<EndpointDetail> {
    await wait(180);
    const endpoint = demoEndpoints.find((item) => item.id === endpointId) ?? demoEndpoints[0];
    return {
      id: endpoint.id,
      method: endpoint.method,
      route: endpoint.route,
      controller: endpoint.controller,
      action: endpoint.action,
      project: endpoint.project.name,
      source: { file: `src/RepoLens.Api/Controllers/${endpoint.controller}.cs`, symbol: endpoint.action },
      evidence: [{ file: `src/RepoLens.Api/Controllers/${endpoint.controller}.cs`, startLine: 20, endLine: 31, reason: "Route and action declaration" }],
    };
  },
  async database() {
    await wait(260);
    return demoDatabase;
  },
  async databaseEntity(entityId: string): Promise<DatabaseEntityDetail> {
    await wait(180);
    const entity = demoDatabase.entities.find((item) => item.id === entityId) ?? demoDatabase.entities[0];
    return {
      ...entity,
      source: { file: `src/RepoLens.Domain/Entities/${entity.name}.cs`, symbol: entity.name },
      relationships: demoDatabase.relationships.filter((item) => item.sourceEntityId === entity.id || item.targetEntityId === entity.id),
      evidence: [{ file: `src/RepoLens.Domain/Entities/${entity.name}.cs`, startLine: 6, endLine: 28, reason: "Entity declaration" }],
    };
  },
  async files(filters: FileQuery = {}) {
    await wait(260);
    const search = filters.search?.toLowerCase();
    const language = filters.language?.toLowerCase();
    const items = demoFiles.filter((file) =>
      (!search || file.path.toLowerCase().includes(search)) &&
      (!language || file.language.toLowerCase() === language),
    );
    return paginate(items, filters.page, filters.pageSize);
  },
  async fileDetail(fileId: string): Promise<FileDetail> {
    await wait(180);
    const file = demoFiles.find((item) => item.id === fileId) ?? demoFiles[0];
    return {
      ...file,
      symbols: [{ id: `symbol-${file.id}`, name: file.path.split("/").at(-1)?.replace(/\.[^.]+$/, "") ?? "Module", fullName: file.path, type: "Class", startLine: 8, endLine: 48 }],
    };
  },
  async fileContent(fileId: string): Promise<FileContent> {
    await wait(180);
    const file = demoFiles.find((item) => item.id === fileId) ?? demoFiles[0];
    const content = file.language === "TypeScript"
      ? "export interface AnalysisSummary {\n  id: string;\n  status: AnalysisStatus;\n}\n"
      : "namespace RepoLens.Api.Controllers;\n\n[ApiController]\npublic class AnalysisController : ControllerBase\n{\n    // Demo source preview\n}\n";
    return { fileId: file.id, path: file.path, language: file.language, content, lineCount: content.split("\n").length };
  },
  async symbolDetail(symbolId: string): Promise<SymbolDetail> {
    await wait(160);
    const file = demoFiles.find((item) => symbolId.includes(item.id)) ?? demoFiles[0];
    const name = file.path.split("/").at(-1)?.replace(/\.[^.]+$/, "") ?? "Module";
    return { id: symbolId, name, fullName: file.path, type: "Class", file: { id: file.id, path: file.path }, startLine: 8, endLine: 48, relationships: [] };
  },
  async chat(request: ChatRequest): Promise<ChatResponse> {
    await wait(620);
    const normalized = request.question.toLowerCase();

    if (normalized.includes("architecture") || normalized.includes("kiến trúc")) {
      return {
        answer: "The demo repository follows a layered .NET structure: the API project exposes HTTP routes, Application owns contracts and orchestration, Domain contains core entities, and Infrastructure implements persistence and external concerns.",
        confidence: "High",
        evidence: [
          { id: "chat-architecture-api", filePath: "src/RepoLens.Api/Program.cs", startLine: 1, endLine: 42, description: "Application startup and service composition." },
          { id: "chat-architecture-di", filePath: "src/RepoLens.Infrastructure/DependencyInjection.cs", symbol: "AddInfrastructure", startLine: 8, endLine: 37, description: "Infrastructure registration boundary." },
        ],
      };
    }

    if (normalized.includes("endpoint") || normalized.includes("api")) {
      return {
        answer: "The demo analysis includes REST endpoints grouped under analysis-scoped controllers. Each detected endpoint can be traced to its controller action and source location in the API explorer.",
        confidence: "High",
        evidence: [
          { id: "chat-endpoint", filePath: "src/RepoLens.Api/Controllers/AnalysesController.cs", symbol: "AnalysesController", startLine: 9, endLine: 58, description: "Analysis lifecycle endpoints." },
        ],
      };
    }

    if (normalized.includes("database") || normalized.includes("entity") || normalized.includes("dữ liệu")) {
      return {
        answer: "The demo persistence model links an Analysis to Projects and each Project to its SourceFiles. Open the Database section to inspect detected properties and relationship confidence.",
        confidence: "Medium",
        evidence: [
          { id: "chat-database", filePath: "src/RepoLens.Infrastructure/Persistence/RepoLensDbContext.cs", symbol: "RepoLensDbContext", startLine: 8, endLine: 46, description: "Entity sets and persistence model entry point." },
        ],
      };
    }

    return {
      answer: "This is a demo response because no backend URL is configured. I can answer sample questions about architecture, API endpoints, or the database model while preserving the same confidence and evidence contract used by the real API.",
      confidence: "Unknown",
      evidence: [],
    };
  },
  async classification(): Promise<import("@/types/api").RepositoryClassification> {
    await wait(200);
    return {
      type: "ApiBackend",
      detectedLanguages: ["C#", "TypeScript"],
      confidence: "High",
      evidences: [
        { filePath: "src/RepoLens.Api/RepoLens.Api.csproj", reason: ".NET project file found", layer: 1 },
        { filePath: "src/RepoLens.Api/Controllers/AnalysesController.cs", reason: "API controller detected", layer: 2 },
        { filePath: "src/RepoLens.Infrastructure/Persistence/RepoLensDbContext.cs", reason: "DbContext subclass found", layer: 2 },
      ],
      summary: "API backend project (C#). Database layer detected. Request flow: Controller → Service → Repository → Database.",
    };
  },
  async diagram(diagramType?: string): Promise<import("@/types/api").DiagramDto> {
    await wait(250);
    const type = diagramType || "architecture";
    return {
      diagramType: type,
      repositoryType: "ApiBackend",
      status: "Success",
      databaseDetected: true,
      availableDiagramTypes: ["architecture", "endpoints", "erd"],
      nodes: [
        { id: "node-client", label: "HTTP Client / Request", kind: "gateway", role: "General", evidence: ["(HTTP Gateway)"] },
        { id: "ctrl-analyses", label: "AnalysesController", kind: "controller", role: "Controller", evidence: ["src/RepoLens.Api/Controllers/AnalysesController.cs", "SRC 1 (L9-L105)"] },
        { id: "ctrl-arch", label: "ArchitectureController", kind: "controller", role: "Controller", evidence: ["src/RepoLens.Api/Controllers/ArchitectureController.cs", "SRC 1 (L9-L150)"] },
        { id: "svc-analysis", label: "AnalysisService", kind: "service", role: "Service", evidence: ["src/RepoLens.Infrastructure/Services/AnalysisService.cs", "SRC 1 (L15-L250)"] },
        { id: "svc-diagram", label: "DiagramService", kind: "service", role: "Service", evidence: ["src/RepoLens.Infrastructure/Services/DiagramService.cs", "SRC 1 (L20-L400)"] },
        { id: "repo-db", label: "RepoLensDbContext", kind: "repository", role: "Repository", evidence: ["src/RepoLens.Infrastructure/Persistence/RepoLensDbContext.cs", "SRC 1 (L10-L80)"] },
        { id: "db-main", label: "PostgreSQL Database", kind: "database", role: "Database", evidence: ["PostgreSQL / Npgsql"] },
      ],
      edges: [
        { id: "e1", from: "node-client", to: "ctrl-analyses", kind: "calls", label: "HTTP POST/GET", confidence: "High", isInferred: true },
        { id: "e2", from: "node-client", to: "ctrl-arch", kind: "calls", label: "HTTP GET", confidence: "High", isInferred: true },
        { id: "e3", from: "ctrl-analyses", to: "svc-analysis", kind: "calls", label: "Calls", confidence: "High", isInferred: false },
        { id: "e4", from: "ctrl-arch", to: "svc-diagram", kind: "calls", label: "Calls", confidence: "High", isInferred: false },
        { id: "e5", from: "svc-analysis", to: "repo-db", kind: "queries", label: "Accesses", confidence: "High", isInferred: false },
        { id: "e6", from: "svc-diagram", to: "repo-db", kind: "queries", label: "Accesses", confidence: "High", isInferred: false },
        { id: "e7", from: "repo-db", to: "db-main", kind: "queries", label: "EF Core / SQL", confidence: "High", isInferred: false },
      ],
      detailCards: [
        {
          nodeId: "node-client",
          title: "HTTP Client / Request",
          role: "General",
          filePath: "(HTTP Gateway)",
          symbol: "HTTP Client",
          lineRange: "SRC 1",
          description: "Điểm khởi đầu nhận yêu cầu HTTP từ bên ngoài hệ thống.",
          upstreamNodes: [],
          downstreamNodes: ["ctrl-analyses", "ctrl-arch"],
        },
        {
          nodeId: "ctrl-analyses",
          title: "AnalysesController",
          role: "Controller",
          filePath: "src/RepoLens.Api/Controllers/AnalysesController.cs",
          symbol: "AnalysesController",
          lineRange: "SRC 1 (L9-L105)",
          description: "Controller tiếp nhận và xử lý vòng đời phân tích repository.",
          upstreamNodes: ["node-client"],
          downstreamNodes: ["svc-analysis"],
        },
        {
          nodeId: "ctrl-arch",
          title: "ArchitectureController",
          role: "Controller",
          filePath: "src/RepoLens.Api/Controllers/ArchitectureController.cs",
          symbol: "ArchitectureController",
          lineRange: "SRC 1 (L9-L150)",
          description: "Controller cung cấp dữ liệu kiến trúc và đồ thị trực quan hóa.",
          upstreamNodes: ["node-client"],
          downstreamNodes: ["svc-diagram"],
        },
        {
          nodeId: "svc-analysis",
          title: "AnalysisService",
          role: "Service",
          filePath: "src/RepoLens.Infrastructure/Services/AnalysisService.cs",
          symbol: "AnalysisService",
          lineRange: "SRC 1 (L15-L250)",
          description: "Service điều phối quá trình tải, scan và phân tích mã nguồn.",
          upstreamNodes: ["ctrl-analyses"],
          downstreamNodes: ["repo-db"],
        },
        {
          nodeId: "svc-diagram",
          title: "DiagramService",
          role: "Service",
          filePath: "src/RepoLens.Infrastructure/Services/DiagramService.cs",
          symbol: "DiagramService",
          lineRange: "SRC 1 (L20-L400)",
          description: "Service sinh sơ đồ chuyên biệt theo loại repository.",
          upstreamNodes: ["ctrl-arch"],
          downstreamNodes: ["repo-db"],
        },
        {
          nodeId: "repo-db",
          title: "RepoLensDbContext",
          role: "Repository",
          filePath: "src/RepoLens.Infrastructure/Persistence/RepoLensDbContext.cs",
          symbol: "RepoLensDbContext",
          lineRange: "SRC 1 (L10-L80)",
          description: "Tầng truy cập dữ liệu sử dụng EF Core và PostgreSQL.",
          upstreamNodes: ["svc-analysis", "svc-diagram"],
          downstreamNodes: ["db-main"],
        },
        {
          nodeId: "db-main",
          title: "PostgreSQL Database",
          role: "Database",
          filePath: "PostgreSQL",
          symbol: "Database",
          lineRange: "SRC 1",
          description: "Cơ sở dữ liệu lưu trữ kết quả phân tích và embedding.",
          upstreamNodes: ["repo-db"],
          downstreamNodes: [],
        },
      ],
    };
  },
};
