"use client";

import React, { useEffect, useState } from "react";
import {
  GitFork,
  FileCode2,
  FolderGit2,
  Tag,
  BookOpen,
  Layers,
  Database,
  ExternalLink,
  Code2,
} from "lucide-react";
import { getAnalysisOverview } from "../../lib/api/analyses";
import type { AnalysisOverviewResponse } from "../../types";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

interface OverviewViewProps {
  analysisId: string;
}

export function OverviewView({ analysisId }: OverviewViewProps) {
  const [overview, setOverview] = useState<AnalysisOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getAnalysisOverview(analysisId)
      .then((data) => {
        if (isMounted) {
          setOverview(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load overview");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId]);

  if (loading) {
    return (
      <div className="workspace-empty" role="status" style={{ minHeight: 380 }}>
        <div className="loading-ring" />
        <strong style={{ color: "var(--foreground)" }}>Loading repository overview</strong>
        <p>Fetching metrics, metadata, and language statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="workspace-empty" style={{ minHeight: 300 }}>
        <p style={{ color: "var(--subtle)" }}>No overview data available for this repository.</p>
      </div>
    );
  }

  const { repository, statistics, languages } = overview;

  const statCards = [
    { label: "Projects", value: statistics.projects, icon: <FolderGit2 size={14} />, color: "var(--accent)" },
    { label: "Source Files", value: statistics.sourceFiles, icon: <FileCode2 size={14} />, color: "var(--success)" },
    { label: "Symbols", value: statistics.symbols, icon: <Tag size={14} />, color: "#b7a9ef" },
    { label: "Dependencies", value: statistics.dependencies, icon: <BookOpen size={14} />, color: "#f59e0b" },
    { label: "API Endpoints", value: statistics.apiEndpoints, icon: <Layers size={14} />, color: "#8fd7d0" },
    { label: "Database Entities", value: statistics.databaseEntities, icon: <Database size={14} />, color: "#e0ae81" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Repo Header */}
      <section className="repo-header">
        <div className="repo-title-wrap">
          <div className="repo-icon">
            <GitFork size={21} aria-hidden="true" />
          </div>
          <div>
            <div className="eyebrow">{repository.sourceType} Repository</div>
            <h1 style={{ color: "var(--foreground)" }}>{repository.name || "Repository"}</h1>
            <p className="repo-url">
              {repository.sourceUrl ? (
                <a
                  href={repository.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--accent)" }}
                >
                  <span>{repository.sourceUrl}</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                "Uploaded archive"
              )}
              {repository.commitHash && (
                <span style={{ marginLeft: 12, color: "var(--subtle)" }}>
                  commit: {repository.commitHash.slice(0, 8)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="repo-actions">
          {repository.sourceUrl && (
            <a
              href={repository.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="secondary-button"
            >
              <span>GitHub</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </section>

      {/* Metrics Grid */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Extraction Metrics
        </div>
        <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {statCards.map((stat) => (
            <div key={stat.label} className="metric-card">
              <div className="metric-heading">
                <span>{stat.label}</span>
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <strong style={{ color: stat.color }}>{stat.value ?? 0}</strong>
              <small>Analyzed entities</small>
            </div>
          ))}
        </div>
      </div>

      {/* Languages Breakdown */}
      {languages && languages.length > 0 && (
        <section className="panel" style={{ minHeight: "auto", padding: 22 }}>
          <div className="panel-header" style={{ marginBottom: 16 }}>
            <div>
              <div className="eyebrow">Polyglot Analyzer</div>
              <h2 style={{ color: "var(--foreground)" }}>Detected Languages</h2>
            </div>
            <Code2 size={16} style={{ color: "var(--subtle)" }} />
          </div>

          {/* Distribution Bar */}
          <div
            style={{
              display: "flex",
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
              marginBottom: 18,
              backgroundColor: "#16161d",
            }}
          >
            {languages.map((lang, index) => {
              const colors = ["#c5b6ff", "#88d9ae", "#f59e0b", "#8fd7d0", "#e0ae81", "#ef9a9a"];
              const color = colors[index % colors.length];
              return (
                <div
                  key={lang.name}
                  style={{
                    width: `${Math.max(2, lang.percentage)}%`,
                    backgroundColor: color,
                  }}
                  title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {languages.map((lang, index) => {
              const colors = ["#c5b6ff", "#88d9ae", "#f59e0b", "#8fd7d0", "#e0ae81", "#ef9a9a"];
              const color = colors[index % colors.length];
              return (
                <div
                  key={lang.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: "#0e0e13",
                    border: "1px solid var(--line)",
                    borderRadius: 5,
                    fontSize: "11px",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{lang.name}</span>
                  <span style={{ color: "var(--subtle)", marginLeft: "auto", fontSize: "10px" }}>
                    {lang.percentage.toFixed(1)}% ({lang.fileCount})
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
