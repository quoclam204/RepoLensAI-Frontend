import { analysisApi } from "@/services/analysis-api";
import { hasBackendConfiguration } from "@/services/api-client";
import { mockAnalysisAdapter } from "@/services/mock-analysis-adapter";
import type { RepositorySubmission } from "@/types/api";

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
};
