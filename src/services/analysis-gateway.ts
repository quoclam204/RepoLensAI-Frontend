import { analysisApi } from "@/services/analysis-api";
import { hasBackendConfiguration } from "@/services/api-client";
import { mockAnalysisAdapter } from "@/services/mock-analysis-adapter";
import type {
  ArchitectureResponse,
  ArchifyV3Document,
  ArchitectureTraceResponse,
  DependencyItem,
  EndpointQuery,
  FileQuery,
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
  classification(analysisId: string) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.classification()
      : analysisApi.classification(analysisId);
  },
  diagram(analysisId: string, diagramType?: string) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.diagram(diagramType)
      : analysisApi.diagram(analysisId, diagramType);
  },
  async architecture(analysisId: string): Promise<VisualGraph> {
    if (usesMockAnalysis) return mockAnalysisAdapter.architecture();
    return normalizeArchitecture(await analysisApi.architecture(analysisId));
  },
  async archifyV3(analysisId: string): Promise<ArchifyV3Document> {
    if (usesMockAnalysis) {
      const graph = await mockAnalysisAdapter.architecture();
      return {
        schema_version: 1,
        diagram_type: "architecture",
        meta: { title: "RepoLens Architecture", subtitle: "Mock Analysis" },
        components: graph.nodes.map((n) => ({
          id: n.id,
          type: n.kind || "runtime",
          label: n.label,
          category: "runtime",
        })),
        boundaries: [],
        connections: graph.edges.map((e) => ({
          id: e.id,
          from: e.source,
          to: e.target,
          label: e.relationship,
        })),
      };
    }
    return analysisApi.archifyV3(analysisId);
  },
  async traceRoute(analysisId: string, from: string, to: string): Promise<ArchitectureTraceResponse> {
    if (usesMockAnalysis) {
      return {
        analysisId,
        fromNodeId: from,
        toNodeId: to,
        found: false,
        pathNodes: [],
        pathEdges: [],
        evidences: [],
      };
    }
    return analysisApi.traceRoute(analysisId, from, to);
  },
  exportArchifyHtmlUrl(analysisId: string, theme = "dark") {
    return analysisApi.exportArchifyHtmlUrl(analysisId, theme);
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
  endpoints(analysisId: string, filters: EndpointQuery = {}) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.endpoints(filters)
      : analysisApi.endpoints(analysisId, filters);
  },
  endpointDetail(analysisId: string, endpointId: string) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.endpointDetail(endpointId)
      : analysisApi.endpointDetail(analysisId, endpointId);
  },
  database(analysisId: string) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.database()
      : analysisApi.database(analysisId);
  },
  databaseEntity(analysisId: string, entityId: string) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.databaseEntity(entityId)
      : analysisApi.databaseEntity(analysisId, entityId);
  },
  files(analysisId: string, filters: FileQuery = {}) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.files(filters)
      : analysisApi.files(analysisId, filters);
  },
  fileDetail(analysisId: string, fileId: string) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.fileDetail(fileId)
      : analysisApi.fileDetail(analysisId, fileId);
  },
  fileContent(analysisId: string, fileId: string) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.fileContent(fileId)
      : analysisApi.fileContent(analysisId, fileId);
  },
  symbolDetail(analysisId: string, symbolId: string) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.symbolDetail(symbolId)
      : analysisApi.symbolDetail(analysisId, symbolId);
  },
  chat(analysisId: string, question: string) {
    return usesMockAnalysis
      ? mockAnalysisAdapter.chat({ question })
      : analysisApi.chat(analysisId, { question });
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
