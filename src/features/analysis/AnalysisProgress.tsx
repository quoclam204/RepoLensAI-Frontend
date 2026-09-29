import React from "react";
import type { AnalysisStatusResponse } from "../../types";
import { Card } from "../../components/ui/Card";

interface AnalysisProgressProps {
  status: AnalysisStatusResponse;
  onRefresh?: () => void;
}

const ORDERED_STAGES = [
  { key: "Validation", label: "Validation" },
  { key: "RepositoryAcquisition", label: "Repository Acquisition" },
  { key: "FileScanning", label: "File Scanning" },
  { key: "StaticAnalysis", label: "Static Analysis" },
  { key: "DependencyAnalysis", label: "Dependency Analysis" },
  { key: "EvidenceGeneration", label: "Evidence Generation" },
  { key: "Persistence", label: "Persistence" },
  { key: "Chunking", label: "Chunking" },
  { key: "Embedding", label: "Embedding" },
  { key: "Indexing", label: "Indexing" },
  { key: "Completed", label: "Completed" },
];

export function AnalysisProgress({ status, onRefresh }: AnalysisProgressProps) {
  const currentStageIndex = ORDERED_STAGES.findIndex(
    (s) => s.key.toLowerCase() === (status.stage || "").toLowerCase()
  );

  const isFailed = status.status === "Failed";
  const isCompleted = status.status === "Completed";

  return (
    <Card style={{ padding: 28, maxWidth: 840, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: 4 }}>
            {isCompleted ? "Analysis Complete" : isFailed ? "Analysis Failed" : "Analyzing Repository..."}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Analysis ID: <code style={{ color: "#93c5fd" }}>{status.id}</code>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            className={`badge ${
              isCompleted ? "badge-completed" : isFailed ? "badge-failed" : "badge-progress"
            }`}
          >
            {!isCompleted && !isFailed && <span className="spinner" style={{ width: 10, height: 10 }} />}
            {status.status}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                background: "transparent",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              ? Refresh
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 8 }}>
          <span style={{ color: "var(--text-secondary)" }}>
            Current Stage: <strong style={{ color: "var(--text-primary)" }}>{status.stage || "Initializing"}</strong>
          </span>
          <span style={{ fontWeight: 700, color: "#60a5fa" }}>
            {isCompleted ? "100%" : `${Math.max(0, Math.min(100, status.progress))}%`}
          </span>
        </div>
        <div
          style={{
            height: 8,
            backgroundColor: "var(--bg-secondary)",
            borderRadius: 9999,
            overflow: "hidden",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${isCompleted ? 100 : Math.max(5, Math.min(100, status.progress))}%`,
              backgroundColor: isFailed ? "#ef4444" : isCompleted ? "#10b981" : "#3b82f6",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Stage pipeline checklist */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 10,
          backgroundColor: "var(--bg-secondary)",
          padding: 16,
          borderRadius: 8,
          border: "1px solid var(--border-subtle)",
        }}
      >
        {ORDERED_STAGES.map((stage, idx) => {
          let stageStatus: "completed" | "current" | "pending" | "failed" = "pending";

          if (isCompleted) {
            stageStatus = "completed";
          } else if (isFailed) {
            if (idx === currentStageIndex) stageStatus = "failed";
            else if (idx < currentStageIndex) stageStatus = "completed";
            else stageStatus = "pending";
          } else {
            if (idx < currentStageIndex) stageStatus = "completed";
            else if (idx === currentStageIndex) stageStatus = "current";
            else stageStatus = "pending";
          }

          return (
            <div
              key={stage.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 8px",
                borderRadius: 6,
                backgroundColor: stageStatus === "current" ? "rgba(59, 130, 246, 0.12)" : "transparent",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  backgroundColor:
                    stageStatus === "completed"
                      ? "rgba(16, 185, 129, 0.2)"
                      : stageStatus === "failed"
                      ? "rgba(239, 68, 68, 0.2)"
                      : stageStatus === "current"
                      ? "rgba(59, 130, 246, 0.25)"
                      : "#1e293b",
                  color:
                    stageStatus === "completed"
                      ? "#34d399"
                      : stageStatus === "failed"
                      ? "#f87171"
                      : stageStatus === "current"
                      ? "#60a5fa"
                      : "#64748b",
                  border:
                    stageStatus === "current"
                      ? "1px solid #3b82f6"
                      : "1px solid transparent",
                }}
              >
                {stageStatus === "completed" && "?"}
                {stageStatus === "failed" && "!"}
                {stageStatus === "current" && "?"}
                {stageStatus === "pending" && idx + 1}
              </div>

              <span
                style={{
                  fontSize: "0.825rem",
                  fontWeight: stageStatus === "current" ? 600 : 400,
                  color:
                    stageStatus === "completed"
                      ? "var(--text-primary)"
                      : stageStatus === "current"
                      ? "#93c5fd"
                      : stageStatus === "failed"
                      ? "#fca5a5"
                      : "var(--text-muted)",
                }}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Failure details if any */}
      {isFailed && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 8,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <div style={{ fontWeight: 700, color: "#f87171", marginBottom: 4 }}>
            Analysis Failed at stage: {status.stage || "Unknown"}
          </div>
          <p style={{ fontSize: "0.85rem", color: "#fca5a5" }}>
            {status.error || "The analysis encountered an error and could not complete."}
          </p>
        </div>
      )}
    </Card>
  );
}
