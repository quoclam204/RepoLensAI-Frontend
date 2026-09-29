"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GitFork,
  Upload,
  ArrowRight,
  GitBranch,
  Database,
  Sparkles,
  FileCode2,
  CheckCircle2,
  FolderArchive,
  Layers,
} from "lucide-react";
import { createAnalysisFromGit, uploadAnalysisZip } from "@/lib/api/analyses";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

export default function HomePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"git" | "zip">("git");
  const [gitUrl, setGitUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<{ message: string; code?: string } | null>(null);

  const sampleRepos = [
    { label: "Hello-World (Minimal)", url: "https://github.com/octocat/Hello-World" },
    { label: "RepoLens Backend (Self-analysis)", url: "https://github.com/quoclam204/RepoLensAI-Backend" },
  ];

  function validateGitUrl(url: string): string | null {
    const trimmed = url.trim();
    if (!trimmed) {
      return "Please enter a repository URL.";
    }
    try {
      const parsed = new URL(trimmed);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "URL must start with http:// or https://";
      }
      if (!parsed.hostname.includes(".")) {
        return "Please enter a valid repository hostname (e.g. github.com).";
      }
    } catch {
      return "Invalid repository URL format.";
    }
    return null;
  }

  async function handleGitSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    const err = validateGitUrl(gitUrl);
    if (err) {
      setValidationError(err);
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAnalysisFromGit({
        sourceType: "GitUrl",
        sourceUrl: gitUrl.trim(),
      });
      router.push(`/analyses/${res.analysisId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError({ message: error.message, code: error.code });
      } else {
        setApiError({ message: "An unexpected error occurred while submitting analysis." });
      }
      setSubmitting(false);
    }
  }

  async function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    if (!selectedFile) {
      setValidationError("Please select a .zip archive to analyze.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
      setValidationError("Uploaded file must have a .zip extension.");
      return;
    }

    const maxSizeBytes = 100 * 1024 * 1024; // 100MB
    if (selectedFile.size > maxSizeBytes) {
      setValidationError("ZIP archive exceeds the maximum allowed size (100MB).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await uploadAnalysisZip(selectedFile);
      router.push(`/analyses/${res.analysisId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError({ message: error.message, code: error.code });
      } else {
        setApiError({ message: "An unexpected error occurred while uploading ZIP." });
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="dashboard-shell" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navigation */}
      <header className="dashboard-header" style={{ padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" className="brand-link">
            <span className="brand-mark">
              <GitFork aria-hidden="true" size={16} />
            </span>
            <span>
              RepoLens <em>AI</em>
            </span>
          </a>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 7px",
              borderRadius: "4px",
              background: "#1c1926",
              color: "var(--accent)",
              border: "1px solid #36304b",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            v1.0
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a
            href="https://github.com/quoclam204/RepoLensAI-Backend"
            target="_blank"
            rel="noreferrer"
            className="secondary-button"
            style={{ height: 30, fontSize: "11px" }}
          >
            Backend Docs
          </a>
        </nav>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: 960, margin: "0 auto", padding: "48px 24px 60px", width: "100%" }}>
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: 38 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Visual Repository Intelligence
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4.5vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
              margin: "0 0 14px",
              color: "var(--foreground)",
            }}
          >
            Understand your codebase visually.
          </h1>
          <p
            style={{
              fontSize: "clamp(13px, 2vw, 15px)",
              color: "var(--muted)",
              maxWidth: 620,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Extract interactive architecture graphs, dependencies, endpoints, entity models, and
            evidence-grounded AI insights directly from code.
          </p>
        </div>

        {/* Launcher Panel */}
        <section
          className="panel"
          style={{
            padding: 24,
            marginBottom: 32,
            boxShadow: "0 16px 36px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Tab Switcher */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--line)",
              marginBottom: 22,
              gap: 8,
            }}
          >
            <button
              type="button"
              className={`nav-tab ${activeTab === "git" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("git");
                setValidationError(null);
                setApiError(null);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
            >
              <GitBranch size={14} />
              GitHub Repository URL
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === "zip" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("zip");
                setValidationError(null);
                setApiError(null);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
            >
              <Upload size={14} />
              Upload ZIP Archive
            </button>
          </div>

          {/* Validation & API Errors */}
          {validationError && (
            <div style={{ marginBottom: 18 }}>
              <ErrorMessage message={validationError} />
            </div>
          )}
          {apiError && (
            <div style={{ marginBottom: 18 }}>
              <ErrorMessage message={apiError.message} code={apiError.code} />
            </div>
          )}

          {/* Tab 1: Git URL Form */}
          {activeTab === "git" && (
            <form onSubmit={handleGitSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="gitUrl"
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  GitHub Repository URL
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "#0d0d11",
                    border: "1px solid var(--line-bright)",
                    borderRadius: 6,
                    padding: "0 14px",
                  }}
                >
                  <GitBranch size={16} style={{ color: "var(--subtle)", flexShrink: 0 }} />
                  <input
                    id="gitUrl"
                    type="url"
                    placeholder="https://github.com/organization/repository"
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    disabled={submitting}
                    style={{
                      width: "100%",
                      height: 44,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--foreground)",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "11px", color: "var(--subtle)" }}>
                  <span>Quick samples:</span>
                  {sampleRepos.map((repo) => (
                    <button
                      key={repo.url}
                      type="button"
                      onClick={() => setGitUrl(repo.url)}
                      disabled={submitting}
                      className="text-button"
                      style={{ fontSize: "11px" }}
                    >
                      {repo.label}
                    </button>
                  ))}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={submitting}
                  disabled={submitting}
                  style={{ height: 38, padding: "0 18px" }}
                >
                  <span>Start Analysis</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </form>
          )}

          {/* Tab 2: ZIP Upload Form */}
          {activeTab === "zip" && (
            <form onSubmit={handleZipSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="zipFileInput"
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  Repository ZIP File
                </label>
                <div
                  style={{
                    border: "1px dashed var(--line-bright)",
                    borderRadius: 6,
                    padding: "32px 20px",
                    textAlign: "center",
                    backgroundColor: "#0d0d11",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease, background 0.2s ease",
                  }}
                  onClick={() => document.getElementById("zipFileInput")?.click()}
                >
                  <input
                    id="zipFileInput"
                    type="file"
                    accept=".zip,application/zip"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedFile(file);
                    }}
                    disabled={submitting}
                    style={{ display: "none" }}
                  />
                  <div
                    className="state-icon"
                    style={{ margin: "0 auto 12px", width: 40, height: 40, color: "var(--accent)" }}
                  >
                    <FolderArchive size={20} />
                  </div>
                  <strong style={{ display: "block", color: "var(--foreground)", fontSize: "13px", marginBottom: 4 }}>
                    {selectedFile ? selectedFile.name : "Click to select a repository .zip archive"}
                  </strong>
                  <p style={{ fontSize: "11px", color: "var(--subtle)", margin: 0 }}>
                    {selectedFile
                      ? `File size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : "Maximum allowed file size: 100MB"}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={submitting}
                  disabled={submitting || !selectedFile}
                  style={{ height: 38, padding: "0 18px" }}
                >
                  <Upload size={14} />
                  <span>Upload & Analyze</span>
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* Feature Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          <div className="metric-card" style={{ padding: 18 }}>
            <div className="metric-heading">
              <span style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "10px", fontWeight: 700 }}>
                Architecture
              </span>
              <Layers size={14} style={{ color: "var(--accent)" }} />
            </div>
            <strong style={{ fontSize: "15px", margin: "10px 0 4px", color: "var(--foreground)" }}>
              Visual Topology
            </strong>
            <small style={{ color: "var(--subtle)", fontSize: "11px", lineHeight: 1.5, display: "block" }}>
              Explore interactive node graphs, dependency flows, and C4 component relationships.
            </small>
          </div>

          <div className="metric-card" style={{ padding: 18 }}>
            <div className="metric-heading">
              <span style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "10px", fontWeight: 700 }}>
                APIs & Schemas
              </span>
              <Database size={14} style={{ color: "var(--success)" }} />
            </div>
            <strong style={{ fontSize: "15px", margin: "10px 0 4px", color: "var(--foreground)" }}>
              Endpoints & Data
            </strong>
            <small style={{ color: "var(--subtle)", fontSize: "11px", lineHeight: 1.5, display: "block" }}>
              Detect ASP.NET / REST endpoints, database entities, fields, and relational links.
            </small>
          </div>

          <div className="metric-card" style={{ padding: 18 }}>
            <div className="metric-heading">
              <span style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "10px", fontWeight: 700 }}>
                Grounded AI
              </span>
              <Sparkles size={14} style={{ color: "#e0ae81" }} />
            </div>
            <strong style={{ fontSize: "15px", margin: "10px 0 4px", color: "var(--foreground)" }}>
              Evidence Traceability
            </strong>
            <small style={{ color: "var(--subtle)", fontSize: "11px", lineHeight: 1.5, display: "block" }}>
              Ask questions grounded strictly in analyzed files, symbols, and verifiable line ranges.
            </small>
          </div>
        </div>
      </main>
    </div>
  );
}
