"use client";

import React, { useState } from "react";
import {
  Sparkles,
  MessageSquare,
  FileCode2,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useChat } from "./useChat";
import type { ChatConfidence, ChatEvidenceItem } from "../../types";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

interface ChatPanelProps {
  analysisId: string;
  onOpenEvidenceFile?: (evidence: ChatEvidenceItem) => void;
}

export function ChatPanel({ analysisId, onOpenEvidenceFile }: ChatPanelProps) {
  const { state, messages, ask } = useChat(analysisId);
  const [inputQuestion, setInputQuestion] = useState("");

  const sampleQuestions = [
    "Where is authentication implemented?",
    "What database entities and models are defined?",
    "What are the main API endpoints in this repository?",
    "Explain the dependency structure and entry point.",
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || state.status === "loading") return;
    const q = inputQuestion;
    setInputQuestion("");
    await ask(q);
  };

  const getConfidenceBadge = (confidence?: ChatConfidence) => {
    switch (confidence) {
      case "high":
        return {
          label: "High Confidence",
          color: "var(--success, #88d9ae)",
        };
      case "medium":
        return {
          label: "Medium Confidence",
          color: "var(--warning, #f59e0b)",
        };
      case "low":
        return {
          label: "Low Confidence",
          color: "var(--danger, #ef9a9a)",
        };
      case "unknown":
      default:
        return {
          label: "Low Evidence",
          color: "var(--subtle, #5e5d68)",
        };
    }
  };

  return (
    <section className="chat-panel" aria-label="Repository Assistant" style={{ minHeight: 650 }}>
      {/* Panel Heading */}
      <div className="panel-heading">
        <div>
          <div className="eyebrow">Repository-scoped assistant</div>
          <h2 id="chat-title" style={{ color: "var(--foreground)" }}>
            Ask about this codebase
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "10px", color: "var(--subtle)" }}>
          <ShieldCheck size={14} style={{ color: "var(--accent)" }} />
          <span>Evidence Grounded</span>
        </div>
      </div>

      {/* Messages Transcript */}
      <div className="chat-transcript" style={{ flex: 1, overflowY: "auto", maxHeight: 520 }}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <span className="state-icon">
              <Sparkles size={17} aria-hidden="true" />
            </span>
            <strong style={{ color: "var(--foreground)" }}>Ask a question about your repository</strong>
            <p>
              Answers are grounded strictly in analyzed source evidence. If the repository does not support an
              answer, you will see that clearly.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
                maxWidth: 480,
                marginTop: 20,
              }}
            >
              {sampleQuestions.map((sq) => (
                <button
                  key={sq}
                  type="button"
                  onClick={() => setInputQuestion(sq)}
                  className="secondary-button"
                  style={{ height: 28, fontSize: "10px", borderRadius: 20 }}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === "user";
            const badge = !isUser ? getConfidenceBadge(message.confidence) : null;
            const isInsufficient =
              !isUser &&
              (message.content.includes("Insufficient evidence") || message.confidence === "unknown");

            return (
              <article key={message.id} className={`chat-message ${isUser ? "user" : ""}`}>
                <div className="message-role">{isUser ? "You" : "RepoLens AI"}</div>
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {message.content || "Insufficient evidence in the analyzed repository."}
                </p>

                {!isUser && badge && (
                  <div className="answer-confidence" style={{ color: badge.color }}>
                    {badge.label}
                  </div>
                )}

                {!isUser && message.evidence && message.evidence.length > 0 && (
                  <div className="source-stack">
                    <span>Evidence Sources ({message.evidence.length})</span>
                    {message.evidence.map((ev, idx) => {
                      const hasRange = ev.startLine && ev.endLine;
                      const rangeStr = hasRange ? `Lines ${ev.startLine}–${ev.endLine}` : "Full file";

                      return (
                        <div key={`${ev.file}-${idx}`} className="chat-source">
                          <FileCode2 size={13} aria-hidden="true" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{ev.symbol || ev.file}</strong>
                            <small>
                              {ev.file} • {rangeStr}
                            </small>
                            {ev.reason && (
                              <small style={{ color: "#9b98a8", marginTop: 2 }}>{ev.reason}</small>
                            )}
                          </div>
                          {onOpenEvidenceFile && (
                            <button
                              onClick={() => onOpenEvidenceFile(ev)}
                              className="open-source"
                              title="Inspect file"
                              aria-label={`Open source ${ev.file}`}
                            >
                              <ArrowUpRight size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isInsufficient && (
                  <div className="insufficient-note">
                    Insufficient verifiable evidence in the analyzed repository for this question.
                  </div>
                )}
              </article>
            );
          })
        )}

        {state.status === "loading" && (
          <div className="chat-empty" role="status" style={{ minHeight: 180 }}>
            <div className="loading-ring" />
            <strong style={{ color: "var(--foreground)" }}>Searching repository evidence</strong>
            <p>Scanning code indexes before composing an answer...</p>
          </div>
        )}

        {state.status === "error" && (
          <div style={{ padding: 18 }}>
            <ErrorMessage
              message={state.error?.message || "Failed to get an answer from the analysis assistant."}
            />
          </div>
        )}
      </div>

      {/* Composer Form */}
      <form className="chat-composer" onSubmit={handleSend}>
        <textarea
          aria-label="Ask a question about the repository"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder="Ask a question about this repository (Enter to submit, Shift+Enter for new line)..."
          rows={3}
          disabled={state.status === "loading"}
        />
        <div className="composer-footer">
          <span>Answers include source evidence when available.</span>
          <button
            className="primary-button"
            type="submit"
            disabled={!inputQuestion.trim() || state.status === "loading"}
          >
            <MessageSquare size={13} aria-hidden="true" />
            <span>Ask</span>
          </button>
        </div>
      </form>
    </section>
  );
}
