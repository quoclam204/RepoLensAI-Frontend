import { analysisApi } from "@/services/analysis-api";
import { hasBackendConfiguration } from "@/services/api-client";
import { mockAnalysisAdapter } from "@/services/mock-analysis-adapter";
import type {
  ArchitectureResponse,
  DependencyItem,
  RepositorySubmission,
  VisualGraph,
} from "@/types/api";

const forceMock = process.env.NEXT_PUBLIC_DATA_SOURCE === "mock";
export const usesMockAnalysis = forceMock || !hasBackendConfiguration();

export const analysisGateway = {
  create(submission: RepositorySubmission) {
    if (usesMockAnalysis) return mockAnalysisAdapter.create(submission);
    return submission.type === "GitUrl"
      ? analysisApi.createFromGitUrl({ repositoryUrl: submission.repositoryUrl })
      : analysisApi.createFromZip(submission.file);
  },
  get(analysisId: string) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.get(analysisId)
      : analysisApi.get(analysisId);
  },
  overview(analysisId: string) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.overview(analysisId)
      : analysisApi.overview(analysisId);
  },
  async architecture(analysisId: string): Promise<VisualGraph> {
    if (usesMockAnalysis) return mockAnalysisAdapter.architecture();
    return normalizeArchitecture(await analysisApi.architecture(analysisId));
  },
  async dependencies(analysisId: string): Promise<VisualGraph> {
    if (usesMockAnalysis) return mockAnalysisAdapter.dependencies();

    const firstPage = await analysisApi.dependencies(analysisId);
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
        analysisApi.dependencies(analysisId, index + 2),
      ),
    );
    return normalizeDependencies(
      [firstPage, ...remainingPages].flatMap((page) => page.items),
      firstPage.totalCount,
    );
  },
};

function normalizeArchitecture(response: ArchitectureResponse): VisualGraph {
  return {
    nodes: response.nodes.map((node) => ({
      id: node.id,
      label: node.name,
      kind: node.type,
      path: node.path,
      metadata: node.metadata,
    })),
    edges: response.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relationship: edge.type,
      confidence: edge.confidence,
      evidence: edge.evidence,
      evidenceId: edge.evidenceId,
    })),
    totalRelationships: response.edges.length,
  };
}

function normalizeDependencies(
  dependencies: DependencyItem[],
  totalRelationships: number,
): VisualGraph {
  const nodes = new Map<string, VisualGraph["nodes"][number]>();
  for (const dependency of dependencies) {
    nodes.set(dependency.source.id, {
      id: dependency.source.id,
      label: dependency.source.name,
      kind: dependency.source.type,
    });
    nodes.set(dependency.target.id, {
      id: dependency.target.id,
      label: dependency.target.name,
      kind: dependency.target.type,
    });
  }

  return {
    nodes: [...nodes.values()],
    edges: dependencies.map((dependency) => ({
      id: dependency.id,
      source: dependency.source.id,
      target: dependency.target.id,
      relationship: dependency.type,
      evidenceId: dependency.evidenceId,
    })),
    totalRelationships,
  };
}
