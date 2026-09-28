import type {
  AnalysisStatus,
  AnalysisSummary,
  RepositoryOverview,
  RepositorySubmission,
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
    { id: "api", label: "RepoLens.Api", kind: "Project", path: "src/RepoLens.Api", metadata: { language: "C#", projectType: "Web API" } },
    { id: "application", label: "RepoLens.Application", kind: "Project", path: "src/RepoLens.Application", metadata: { language: "C#", projectType: "Class Library" } },
    { id: "domain", label: "RepoLens.Domain", kind: "Project", path: "src/RepoLens.Domain", metadata: { language: "C#", projectType: "Class Library" } },
    { id: "infrastructure", label: "RepoLens.Infrastructure", kind: "Project", path: "src/RepoLens.Infrastructure", metadata: { language: "C#", projectType: "Class Library" } },
    { id: "analysis", label: "RepoLens.Analysis", kind: "Project", path: "src/RepoLens.Analysis", metadata: { language: "C#", projectType: "Analyzer" } },
  ],
  edges: [
    { id: "api-application", source: "api", target: "application", relationship: "ProjectReference", confidence: "confirmed" },
    { id: "api-infrastructure", source: "api", target: "infrastructure", relationship: "ProjectReference", confidence: "confirmed" },
    { id: "infrastructure-application", source: "infrastructure", target: "application", relationship: "ProjectReference", confidence: "confirmed" },
    { id: "application-domain", source: "application", target: "domain", relationship: "ProjectReference", confidence: "confirmed" },
    { id: "analysis-application", source: "analysis", target: "application", relationship: "ProjectReference", confidence: "confirmed" },
  ],
  totalRelationships: 5,
};

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
};
