import React, { useState } from "react";
import { useChat } from "./useChat";
import type { ChatConfidence, ChatEvidenceItem } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
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
          bg: "rgba(16, 185, 129, 0.15)",
          color: "#34d399",
          border: "rgba(16, 185, 129, 0.3)",
        };
      case "medium":
        return {
          label: "Medium Confidence",
          bg: "rgba(245, 158, 11, 0.15)",
          color: "#fbbf24",
          border: "rgba(245, 158, 11, 0.3)",
        };
      case "low":
        return {
          label: "Low Confidence",
          bg: "rgba(249, 115, 22, 0.15)",
          color: "#fb923c",
          border: "rgba(249, 115, 22, 0.3)",
        };
      case "unknown":
      default:
        return {
          label: "Unknown / Low Evidence",
          bg: "rgba(148, 163, 184, 0.15)",
          color: "#94a3b8",
          border: "rgba(148, 163, 184, 0.3)",
        };
    }
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: 680 }}>
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          backgroundColor: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.2rem" }}>??</span>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Grounded AI Repository Assistant</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Strictly grounded answers with file & line evidence traceability.
            </p>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div
        style={{
          flexGrow: 1,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", margin: "auto 0", padding: "20px 0" }}>
            <div style={{ fontSize: "2.2rem", marginBottom: 12 }}>??</div>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>
              Ask anything about this codebase
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: 440, margin: "0 auto 20px" }}>
              RepoLens AI uses vector chunk retrieval and semantic analysis to answer questions with verifiable proof.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 540, margin: "0 auto" }}>
              {sampleQuestions.map((sq) => (
                <button
                  key={sq}
                  type="button"
                  onClick={() => {
                    setInputQuestion(sq);
                  }}
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    borderRadius: 20,
                    padding: "6px 14px",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            const badge = !isUser ? getConfidenceBadge(msg.confidence) : null;
            const isInsufficient =
              !isUser &&
              (msg.content.includes("Insufficient evidence") || msg.confidence === "unknown");

            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: isUser ? "75%" : "85%",
                }}
              >
                <div
                  style={{
                    backgroundColor: isUser ? "#2563eb" : "var(--bg-secondary)",
                    color: isUser ? "#ffffff" : "var(--text-primary)",
                    borderRadius: 12,
                    padding: "14px 18px",
                    border: isUser ? "none" : "1px solid var(--border-color)",
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                  }}
                >
                  {/* Assistant header: confidence badge */}
                  {!isUser && badge && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: "2px 8px",
                          borderRadius: 9999,
                          textTransform: "uppercase",
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  )}

                  {/* Message Content */}
                  <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>

                  {/* Insufficient evidence callout banner */}
                  {isInsufficient && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "8px 12px",
                        backgroundColor: "rgba(100, 116, 139, 0.15)",
                        borderRadius: 6,
                        borderLeft: "3px solid #64748b",
                        fontSize: "0.8rem",
                        color: "#94a3b8",
                      }}
                    >
                      ?? <em>The system refrains from hallucinating without grounded repository proof.</em>
                    </div>
                  )}

                  {/* Traceable Evidence Snippets */}
                  {!isUser && msg.evidence && msg.evidence.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#93c5fd",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Traceable Evidence ({msg.evidence.length})
                      </span>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {msg.evidence.map((ev, i) => (
                          <div
                            key={i}
                            style={{
                              backgroundColor: "var(--bg-primary)",
                              border: "1px solid var(--border-color)",
                              borderRadius: 6,
                              padding: "8px 10px",
                              fontSize: "0.8rem",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: 600, color: "#60a5fa" }}>
                                ?? {ev.file} {ev.startLine > 0 ? `(Lines ${ev.startLine}-${ev.endLine})` : ""}
                              </span>
                              {onOpenEvidenceFile && (
                                <button
                                  type="button"
                                  onClick={() => onOpenEvidenceFile(ev)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#93c5fd",
                                    fontSize: "0.75rem",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    padding: 0,
                                  }}
                                >
                                  Open in File View
                                </button>
                              )}
                            </div>

                            {ev.symbol && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                                Symbol: <code>{ev.symbol}</code>
                              </div>
                            )}

                            {ev.reason && (
                              <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: 4 }}>
                                {ev.reason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {state.status === "loading" && (
          <div style={{ alignSelf: "flex-start", maxWidth: "80%" }}>
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderRadius: 12,
                padding: "12px 18px",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
              }}
            >
              <span className="spinner" style={{ width: 14, height: 14 }} />
              <span>Analyzing code and verifying evidence...</span>
            </div>
          </div>
        )}

        {state.status === "error" && (
          <ErrorMessage
            message={state.error.message || "Chat query failed. Ensure backend AI service is configured."}
            style={{ margin: "8px 0" }}
          />
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        style={{
          padding: 16,
          backgroundColor: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          gap: 10,
        }}
      >
        <input
          type="text"
          placeholder="Ask a question about this repository..."
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          disabled={state.status === "loading"}
          style={{
            flexGrow: 1,
            padding: "10px 14px",
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 8,
            fontSize: "0.9rem",
            outline: "none",
          }}
        />

        <Button
          type="submit"
          variant="primary"
          loading={state.status === "loading"}
          disabled={!inputQuestion.trim() || state.status === "loading"}
        >
          Ask AI
        </Button>
      </form>
    </Card>
  );
}
