import { useCallback, useState } from "react";
import { postChat } from "../../lib/api/chat";
import type { ChatResponse } from "../../types";
import type { AsyncState } from "../../lib/async-state";
import { errorState, idleState, loadingState, successState } from "../../lib/async-state";

/**
 * Minimal container state for the chat feature.
 * Backend: POST /api/analyses/{id}/chat (contracts/api.md Sections 25-29).
 * No chat UI is implemented here; feature teams build on this hook.
 */
export function useChat(analysisId: string) {
  const [state, setState] = useState<AsyncState<ChatResponse>>(idleState());

  const ask = useCallback(
    async (question: string) => {
      setState((prev) => loadingState(prev.data));
      try {
        const data = await postChat(analysisId, { question });
        setState(successState(data));
      } catch (err) {
        setState(errorState(err instanceof Error ? err : new Error("Chat request failed.")));
      }
    },
    [analysisId],
  );

  return { state, ask };
}
