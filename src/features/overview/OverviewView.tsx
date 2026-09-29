import React, { useEffect, useState } from "react";
import { getAnalysisOverview } from "../../lib/api/analyses";
import type { AnalysisOverviewResponse } from "../../types";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
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
    return <Loading label="Loading repository overview..." style={{ padding: "60px 0" }} />;
  }

  if (error) {
    return <ErrorMessage message={error} style={{ margin: "20px 0" }} />;
  }

  if (!overview) {
    return <p style={{ color: "var(--text-muted)", padding: 20 }}>No overview data available.</p>;
  }

  const { repository, statistics, languages } = overview;

  const statCards = [
    { label: "Projects", value: statistics.projects, icon: "??", color: "#60a5fa" },
    { label: "Source Files", value: statistics.sourceFiles, icon: "??", color: "#34d399" },
    { label: "Symbols", value: statistics.symbols, icon: "??", color: "#a78bfa" },
    { label: "Dependencies", value: statistics.dependencies, icon: "??", color: "#f59e0b" },
    { label: "API Endpoints", value: statistics.apiEndpoints, icon: "??", color: "#38bdf8" },
    { label: "Database Entities", value: statistics.databaseEntities, icon: "???", color: "#f472b6" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Repository details */}
      <Card style={{ padding: 20 }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>Repository Metadata</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            fontSize: "0.875rem",
          }}
        >
          <div>
            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>NAME</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{repository.name || "N/A"}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>SOURCE TYPE</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{repository.sourceType}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>SOURCE URL</span>
            <a
              href={repository.sourceUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontWeight: 500, wordBreak: "break-all" }}
            >
              {repository.sourceUrl || "Uploaded archive"}
            </a>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>COMMIT HASH</span>
            <code style={{ color: "#93c5fd" }}>{repository.commitHash ? repository.commitHash.substring(0, 10) : "N/A"}</code>
          </div>
        </div>
      </Card>

      {/* Statistics grid */}
      <div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>Extraction Metrics</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 16,
          }}
        >
          {statCards.map((stat) => (
            <Card key={stat.label} style={{ padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: stat.color }}>
                {stat.value ?? "N/A"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                {stat.label}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Languages breakdown */}
      {languages && languages.length > 0 && (
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>Detected Languages</h3>
          
          {/* Proportion bar */}
          <div
            style={{
              display: "flex",
              height: 12,
              borderRadius: 6,
              overflow: "hidden",
              marginBottom: 16,
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            {languages.map((lang, index) => {
              const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];
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
              const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];
              const color = colors[index % colors.length];
              return (
                <div
                  key={lang.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: "0.85rem",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: color,
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{lang.name}</span>
                  <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>
                    {lang.percentage.toFixed(1)}% ({lang.fileCount} files)
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
