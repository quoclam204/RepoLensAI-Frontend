"use client";

import { useState } from "react";
import Link from "next/link";
import { useAnalysisStatus } from "@/features/analysis/useAnalysisStatus";
import { AnalysisProgress } from "@/features/analysis/AnalysisProgress";
import { OverviewView } from "@/features/overview/OverviewView";
import { ArchitectureGraph } from "@/features/architecture/ArchitectureGraph";
import { ArchifyView } from "@/features/architecture/ArchifyView";
import { DependenciesView } from "@/features/dependencies/DependenciesView";
import { EndpointsView } from "@/features/endpoints/EndpointsView";
import { DatabaseView } from "@/features/database/DatabaseView";
import { FilesExplorerView } from "@/features/files/FilesExplorerView";
import { ChatPanel } from "@/features/chat/ChatPanel";
import { Loading } from "@/components/ui/Loading";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { ChatEvidenceItem } from "@/types";

type AnalysesPageProps = {
  params: { id: string };
};

type ActiveTab =
  | "overview"
  | "architecture"
  | "archify"
  | "dependencies"
  | "endpoints"
  | "database"
  | "files"
  | "chat";

export default function AnalysisDetailPage({ params }: AnalysesPageProps) {
  const analysisId = params.id;
  const { state, refresh } = useAnalysisStatus(analysisId, { pollingInterval: 1500 });
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Evidence file highlighting state when navigated from chat or evidence drawer
  const [highlightFile, setHighlightFile] = useState<{
    filePath?: string;
    startLine?: number;
    endLine?: number;
  } | null>(null);

  const handleOpenEvidenceFile = (ev: ChatEvidenceItem) => {
    setHighlightFile({
      filePath: ev.file,
      startLine: ev.startLine,
      endLine: ev.endLine,
    });
    setActiveTab("files");
  };

  if (state.status === "loading" && !state.data) {
    return (
      <div style={{ maxWidth: 840, margin: "80px auto", padding: "0 20px" }}>
        <Loading label="Connecting to analysis service..." size="lg" />
      </div>
    );
  }

  if (state.status === "error" && !state.data) {
    return (
      <div style={{ maxWidth: 840, margin: "80px auto", padding: "0 20px" }}>
        <ErrorMessage
          message={state.error.message || "Failed to load analysis status."}
          onRetry={refresh}
        />
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Link href="/" style={{ fontSize: "0.9rem", color: "#60a5fa" }}>
            ? Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const statusData = state.data;
  if (!statusData) {
    return null;
  }

  const isCompleted = statusData.status === "Completed";

  return (
    <div style={{ maxWidth: 1200, margin: "24px auto", padding: "0 24px" }}>
      {/* Top Breadcrumb & Status Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 4 }}>
            <Link href="/" style={{ color: "var(--text-secondary)" }}>
              Analyses
            </Link>
            <span>/</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{analysisId}</span>
          </div>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            Analysis Run
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            className={`badge ${
              isCompleted
                ? "badge-completed"
                : statusData.status === "Failed"
                ? "badge-failed"
                : "badge-progress"
            }`}
          >
            {!isCompleted && statusData.status !== "Failed" && (
              <span className="spinner" style={{ width: 10, height: 10 }} />
            )}
            {statusData.status}
          </span>

          <Link
            href="/"
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
              padding: "6px 12px",
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            + New Analysis
          </Link>
        </div>
      </div>

      {/* If analysis is NOT completed, show the live progress tracker */}
      {!isCompleted ? (
        <AnalysisProgress status={statusData} onRefresh={refresh} />
      ) : (
        /* If analysis IS completed, show full dashboard with tabs */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Navigation Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border-color)",
              overflowX: "auto",
              gap: 4,
            }}
          >
            <button
              className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              ?? Overview
            </button>
            <button
              className={`nav-tab ${activeTab === "architecture" ? "active" : ""}`}
              onClick={() => setActiveTab("architecture")}
            >
              ?? Architecture Graph
            </button>
            <button
              className={`nav-tab ${activeTab === "archify" ? "active" : ""}`}
              onClick={() => setActiveTab("archify")}
            >
              ?? Archify C4
            </button>
            <button
              className={`nav-tab ${activeTab === "dependencies" ? "active" : ""}`}
              onClick={() => setActiveTab("dependencies")}
            >
              ?? Dependencies
            </button>
            <button
              className={`nav-tab ${activeTab === "endpoints" ? "active" : ""}`}
              onClick={() => setActiveTab("endpoints")}
            >
              ?? API Endpoints
            </button>
            <button
              className={`nav-tab ${activeTab === "database" ? "active" : ""}`}
              onClick={() => setActiveTab("database")}
            >
              ??? Database
            </button>
            <button
              className={`nav-tab ${activeTab === "files" ? "active" : ""}`}
              onClick={() => setActiveTab("files")}
            >
              ?? Files & Code
            </button>
            <button
              className={`nav-tab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              ?? AI Q&A
            </button>
          </div>

          {/* Tab Views */}
          {activeTab === "overview" && <OverviewView analysisId={analysisId} />}
          {activeTab === "architecture" && <ArchitectureGraph analysisId={analysisId} />}
          {activeTab === "archify" && <ArchifyView analysisId={analysisId} />}
          {activeTab === "dependencies" && <DependenciesView analysisId={analysisId} />}
          {activeTab === "endpoints" && <EndpointsView analysisId={analysisId} />}
          {activeTab === "database" && <DatabaseView analysisId={analysisId} />}
          {activeTab === "files" && (
            <FilesExplorerView
              analysisId={analysisId}
              initialHighlight={highlightFile || undefined}
            />
          )}
          {activeTab === "chat" && (
            <ChatPanel
              analysisId={analysisId}
              onOpenEvidenceFile={handleOpenEvidenceFile}
            />
          )}
        </div>
      )}
    </div>
  );
}
