import { useCallback, useState } from "react";
import { postChat } from "../../lib/api/chat";
import type { ChatConfidence, ChatEvidenceItem, ChatMessage, ChatResponse } from "../../types";
import type { AsyncState } from "../../lib/async-state";
import { errorState, idleState, loadingState, successState } from "../../lib/async-state";

export interface ExtendedChatMessage extends ChatMessage {
  confidence?: ChatConfidence;
}

/**
 * Container state for the chat feature supporting conversation history and evidence.
 * Backend: POST /api/analyses/{id}/chat (contracts/api.md Sections 25-29).
 */
export function useChat(analysisId: string) {
  const [state, setState] = useState<AsyncState<ChatResponse>>(idleState());
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      const userMsg: ExtendedChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setState(loadingState());

      try {
        const response = await postChat(analysisId, { question: trimmed });
        setState(successState(response));

        const assistantMsg: ExtendedChatMessage = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: response.answer,
          createdAt: new Date().toISOString(),
          confidence: response.confidence,
          evidence: response.evidence,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Chat request failed.");
        setState(errorState(error));
      }
    },
    [analysisId],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setState(idleState());
  }, []);

  return { state, messages, ask, clearChat };
}
