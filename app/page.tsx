"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAnalysisFromGit, uploadAnalysisZip } from "@/lib/api/analyses";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
    <div style={{ maxWidth: 840, margin: "40px auto", padding: "0 20px" }}>
      {/* Hero section */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: 12,
            background: "linear-gradient(135deg, #f8fafc 30%, #93c5fd 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          RepoLens AI
        </h1>
        <p
          style={{
            fontSize: "1.15rem",
            color: "var(--text-secondary)",
            maxWidth: 580,
            margin: "0 auto",
          }}
        >
          Understand any GitHub repository visually.
        </p>
      </div>

      {/* Main card */}
      <Card style={{ padding: 28, position: "relative", overflow: "hidden" }}>
        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border-color)",
            marginBottom: 24,
            gap: 12,
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
          >
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
          >
            Upload ZIP Archive
          </button>
        </div>

        {/* Validation and API errors */}
        {validationError && (
          <ErrorMessage
            message={validationError}
            style={{ marginBottom: 20 }}
          />
        )}
        {apiError && (
          <ErrorMessage
            message={apiError.message}
            code={apiError.code}
            style={{ marginBottom: 20 }}
          />
        )}

        {/* Form: Git URL */}
        {activeTab === "git" && (
          <form onSubmit={handleGitSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="gitUrl"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 8,
                }}
              >
                GitHub Repository URL
              </label>
              <input
                id="gitUrl"
                type="url"
                placeholder="https://github.com/organization/repository"
                value={gitUrl}
                onChange={(e) => setGitUrl(e.target.value)}
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <span>Quick try:</span>
                {sampleRepos.map((repo) => (
                  <button
                    key={repo.url}
                    type="button"
                    onClick={() => setGitUrl(repo.url)}
                    disabled={submitting}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#60a5fa",
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontSize: "0.8rem",
                      padding: 0,
                    }}
                  >
                    {repo.label}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                disabled={submitting}
              >
                Analyze Repository
              </Button>
            </div>
          </form>
        )}

        {/* Form: ZIP Upload */}
        {activeTab === "zip" && (
          <form onSubmit={handleZipSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label
                htmlFor="zipFileInput"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 8,
                }}
              >
                Select .zip File
              </label>
              <div
                style={{
                  border: "2px dashed var(--border-color)",
                  borderRadius: 10,
                  padding: "32px 20px",
                  textAlign: "center",
                  backgroundColor: "var(--bg-secondary)",
                  cursor: "pointer",
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
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>??</div>
                <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  {selectedFile ? selectedFile.name : "Click to select a .zip repository archive"}
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {selectedFile
                    ? `Size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : "Maximum file size: 100MB"}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                disabled={submitting || !selectedFile}
              >
                Upload & Analyze ZIP
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Feature highlights */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginTop: 28,
        }}
      >
        <Card style={{ padding: 16 }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6, color: "#60a5fa" }}>
            ?? Visual Architecture
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Extracts interactive dependency graphs and C4 Archify specifications directly from source code.
          </p>
        </Card>
        <Card style={{ padding: 16 }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6, color: "#34d399" }}>
            ?? APIs & Database
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Automatically detects ASP.NET / REST endpoints and entity relationships with source evidence.
          </p>
        </Card>
        <Card style={{ padding: 16 }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6, color: "#a78bfa" }}>
            ?? Grounded AI Chat
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Ask questions with evidence traceability back to exact files and line numbers.
          </p>
        </Card>
      </div>
    </div>
  );
}
