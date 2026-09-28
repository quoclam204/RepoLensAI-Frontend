import { useCallback, useState } from "react";
import { getAnalysisStatus } from "../../lib/api/analyses";
import type { AnalysisStatusResponse } from "../../types";
import type { AsyncState } from "../../lib/async-state";
import { errorState, idleState, loadingState, successState } from "../../lib/async-state";

/**
 * Minimal container state for the analysis-status feature.
 * Backend: GET /api/analyses/{id} (contracts/api.md Section 7).
 */
export function useAnalysisStatus(analysisId: string) {
  const [state, setState] = useState<AsyncState<AnalysisStatusResponse>>(idleState());

  const refresh = useCallback(async () => {
    setState((prev) => loadingState(prev.data));
    try {
      const data = await getAnalysisStatus(analysisId);
      setState(successState(data));
    } catch (err) {
      setState(errorState(err instanceof Error ? err : new Error("Failed to load analysis status.")));
    }
  }, [analysisId]);

  return { state, refresh };
}
