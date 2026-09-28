import { apiPost } from "./client";
import type { ChatRequest, ChatResponse } from "../../types";

/**
 * contracts/api.md Sections 25-29: POST /api/analyses/{id}/chat
 *
 * Request:  { question }
 * Response: { answer, confidence: high|medium|low|unknown, evidence[] }
 */
export function postChat(
  analysisId: string,
  request: ChatRequest,
  init?: RequestInit,
): Promise<ChatResponse> {
  return apiPost<ChatResponse>(`/analyses/${analysisId}/chat`, request, init);
}
