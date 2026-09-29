"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GitFork,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  GitBranch,
  BookOpen,
  Layers,
  Database,
  FileCode2,
  FileSearch,
  Sparkles,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { useAnalysisStatus } from "@/features/analysis/useAnalysisStatus";
import { AnalysisProgress } from "@/features/analysis/AnalysisProgress";
import { OverviewView } from "@/features/overview/OverviewView";
import { ArchitectureGraph } from "@/features/architecture/ArchitectureGraph";
import { ArchifyView } from "@/features/architecture/ArchifyView";
import { DependenciesView } from "@/features/dependencies/DependenciesView";
import { EndpointsView } from "@/features/endpoints/EndpointsView";
import { DatabaseView } from "@/features/database/DatabaseView";
import { FilesExplorerView } from "@/features/files/FilesExplorerView";
import { EvidenceView } from "@/features/evidence/EvidenceView";
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
  | "evidence"
  | "chat";

export default function AnalysisDetailPage({ params }: AnalysesPageProps) {
  const analysisId = params.id;
  const { state, refresh } = useAnalysisStatus(analysisId, { pollingInterval: 1500 });
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Evidence file highlighting state when navigated from chat or evidence view
  const [highlightFile, setHighlightFile] = useState<{
    filePath?: string;
    startLine?: number;
    endLine?: number;
  } | null>(null);

  const handleOpenEvidenceFile = (ev: {
    file: string;
    startLine?: number;
    endLine?: number;
  }) => {
    setHighlightFile({
      filePath: ev.file,
      startLine: ev.startLine,
      endLine: ev.endLine,
    });
    setActiveTab("files");
  };

  if (state.status === "loading" && !state.data) {
    return (
      <div className="workspace-empty" style={{ minHeight: "80vh" }}>
        <div className="loading-ring" />
        <strong style={{ color: "var(--foreground)" }}>Connecting to analysis service</strong>
        <p>Loading status and repository metadata for {analysisId.slice(0, 8)}...</p>
      </div>
    );
  }

  if (state.status === "error" && !state.data) {
    return (
      <div style={{ maxWidth: 720, margin: "80px auto", padding: "0 20px" }}>
        <ErrorMessage
          message={state.error.message || "Failed to load analysis status."}
          onRetry={refresh}
        />
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link href="/" className="secondary-button" style={{ display: "inline-flex" }}>
            <ArrowLeft size={14} />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const statusData = state.data;
  if (!statusData) {
    return (
      <div className="workspace-empty" style={{ minHeight: "80vh" }}>
        <div className="loading-ring" />
        <strong style={{ color: "var(--foreground)" }}>Connecting to analysis service</strong>
        <p>Loading status and repository metadata for {analysisId.slice(0, 8)}...</p>
      </div>
    );
  }

  const isCompleted = statusData.status === "Completed";

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={15} /> },
    { id: "architecture", label: "Architecture", icon: <GitBranch size={15} /> },
    { id: "archify", label: "Archify C4", icon: <Layers size={15} /> },
    { id: "dependencies", label: "Dependencies", icon: <BookOpen size={15} /> },
    { id: "endpoints", label: "Endpoints", icon: <Layers size={15} /> },
    { id: "database", label: "Database", icon: <Database size={15} /> },
    { id: "files", label: "Files", icon: <FileCode2 size={15} /> },
    { id: "evidence", label: "Evidence", icon: <FileSearch size={15} /> },
    { id: "chat", label: "Chat Assistant", icon: <Sparkles size={15} /> },
  ];

  const currentTabLabel = navItems.find((n) => n.id === activeTab)?.label ?? "Analysis";

  return (
    <div className="workspace-shell" style={{ minHeight: "100vh", display: "flex" }}>
      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? "" : "is-collapsed"}`}>
        <div className="sidebar-top">
          <Link className="brand-link" href="/" aria-label="RepoLens home">
            <span className="brand-mark">
              <GitFork size={16} aria-hidden="true" />
            </span>
            {sidebarOpen && (
              <span>
                RepoLens <em>AI</em>
              </span>
            )}
          </Link>
          <button
            className="icon-button sidebar-toggle"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            onClick={() => setSidebarOpen((v) => !v)}
          >
            {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
          </button>
        </div>

        <nav className="side-nav" aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  width: "100%",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="sidebar-bottom">
            <div className="plan-card">
              <span
                className="status-dot"
                style={{
                  background: isCompleted ? "var(--success)" : "var(--accent)",
                  boxShadow: isCompleted
                    ? "0 0 8px var(--success)"
                    : "0 0 8px var(--accent)",
                }}
              />
              <div style={{ minWidth: 0 }}>
                <strong>{statusData.status}</strong>
                <small title={analysisId}>{analysisId.slice(0, 10)}...</small>
              </div>
            </div>
            <Link className="new-analysis" href="/">
              + New analysis
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <section className="dashboard-main" style={{ display: "flex", flexDirection: "column" }}>
        {/* Header Breadcrumb & Status */}
        <header className="dashboard-header">
          <div className="breadcrumb">
            <Link href="/" style={{ color: "var(--subtle)" }}>
              Workspace
            </Link>
            <span>/</span>
            <span style={{ color: "var(--subtle)" }}>Repository analysis</span>
            <span>/</span>
            <strong>{currentTabLabel}</strong>
          </div>

          <div className="header-actions">
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
              className="secondary-button"
              style={{ height: 30, fontSize: "11px", gap: 5 }}
            >
              <Plus size={13} />
              <span>New Analysis</span>
            </Link>
          </div>
        </header>

        {/* Workspace Content */}
        <div
          className="evidence-content"
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 1520,
            margin: "0 auto",
            padding: "28px clamp(20px, 3.5vw, 48px) 50px",
          }}
        >
          {/* If analysis is NOT completed, show the live progress tracker */}
          {!isCompleted ? (
            <AnalysisProgress status={statusData} onRefresh={refresh} />
          ) : (
            /* If analysis IS completed, show active tab view */
            <div>
              {activeTab === "overview" && <OverviewView analysisId={analysisId} />}
              {activeTab === "architecture" && (
                <ArchitectureGraph
                  analysisId={analysisId}
                  onOpenArchify={() => setActiveTab("archify")}
                  onOpenEvidenceFile={handleOpenEvidenceFile}
                />
              )}
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
              {activeTab === "evidence" && (
                <EvidenceView
                  analysisId={analysisId}
                  onOpenEvidenceFile={handleOpenEvidenceFile}
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
      </section>
    </div>
  );
}
