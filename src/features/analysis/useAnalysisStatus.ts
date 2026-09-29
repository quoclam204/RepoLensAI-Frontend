import { useCallback, useEffect, useRef, useState } from "react";
import { getAnalysisStatus } from "../../lib/api/analyses";
import type { AnalysisStatusResponse } from "../../types";
import type { AsyncState } from "../../lib/async-state";
import { errorState, idleState, loadingState, successState } from "../../lib/async-state";

export interface UseAnalysisStatusOptions {
  pollingInterval?: number; // ms, default 1500
  enabled?: boolean;
}

/**
 * Container state for the analysis-status feature with robust polling.
 * Backend: GET /api/analyses/{id} (contracts/api.md Section 7).
 */
export function useAnalysisStatus(
  analysisId: string,
  options: UseAnalysisStatusOptions = {},
) {
  const { pollingInterval = 1500, enabled = true } = options;
  const [state, setState] = useState<AsyncState<AnalysisStatusResponse>>(idleState());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getAnalysisStatus(analysisId);
      setState(successState(data));
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to load analysis status.");
      setState(errorState(error));
      throw error;
    }
  }, [analysisId]);

  const refresh = useCallback(async () => {
    setState((prev) => loadingState(prev.data));
    try {
      await fetchStatus();
    } catch {
      // state updated in fetchStatus
    }
  }, [fetchStatus]);

  useEffect(() => {
    if (!analysisId || !enabled) return;

    let isMounted = true;

    async function poll() {
      try {
        const data = await getAnalysisStatus(analysisId);
        if (!isMounted) return;
        setState(successState(data));

        if (data.status === "Completed" || data.status === "Failed") {
          return; // Stop polling on terminal states
        }

        timerRef.current = setTimeout(poll, pollingInterval);
      } catch (err) {
        if (!isMounted) return;
        const error = err instanceof Error ? err : new Error("Failed to load analysis status.");
        setState(errorState(error));
      }
    }

    setState(loadingState());
    poll();

    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [analysisId, enabled, pollingInterval]);

  return { state, refresh };
}
