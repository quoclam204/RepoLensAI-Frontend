import type { AnalysisSummary, GraphResponse, RepositoryOverview } from "@/types/api";

export const mockAnalysis: AnalysisSummary = {
  id: "demo-analysis",
  status: "Completed",
  repositoryName: "RepoLensAI",
  repositoryUrl: "https://github.com/example/RepoLensAI",
  progress: 100,
  createdAt: "2026-09-21T08:00:00.000Z",
  updatedAt: "2026-09-21T08:05:00.000Z",
};

export const mockOverview: RepositoryOverview = {
  repositoryName: "RepoLensAI",
  defaultBranch: "main",
  fileCount: 0,
  projectCount: 5,
  symbolCount: 0,
  languages: [],
};

export const emptyGraph: GraphResponse = { nodes: [], edges: [] };

export const mockAnalysisAdapter = {
  async get() { return mockAnalysis; },
  async overview() { return mockOverview; },
  async architecture() { return emptyGraph; },
  async dependencies() { return emptyGraph; },
};
