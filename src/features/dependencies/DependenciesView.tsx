import React, { useEffect, useState } from "react";
import { getDependencies, getDependencyDetail } from "../../lib/api/dependencies";
import type { DependencyDetailResponse, DependencyItem, PagedResult } from "../../types";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

interface DependenciesViewProps {
  analysisId: string;
}

export function DependenciesView({ analysisId }: DependenciesViewProps) {
  const [data, setData] = useState<PagedResult<DependencyItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Selected dependency for detail modal/drawer
  const [selectedDepId, setSelectedDepId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<DependencyDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getDependencies(analysisId, { pageSize: 100 })
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load dependencies");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId]);

  // Load detail when selected
  useEffect(() => {
    if (!selectedDepId) {
      setDetailData(null);
      return;
    }

    let isMounted = true;
    setDetailLoading(true);
    getDependencyDetail(analysisId, selectedDepId)
      .then((res) => {
        if (isMounted) {
          setDetailData(res);
          setDetailLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setDetailLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId, selectedDepId]);

  if (loading) {
    return <Loading label="Loading dependencies..." style={{ padding: "60px 0" }} />;
  }

  if (error) {
    return <ErrorMessage message={error} style={{ margin: "20px 0" }} />;
  }

  const items = data?.items || [];

  const types = Array.from(new Set(items.map((i) => i.type).filter(Boolean)));

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.source?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.target?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search and filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Filter by source or target name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "8px 14px",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            fontSize: "0.85rem",
            minWidth: 260,
            outline: "none",
          }}
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: "8px 14px",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            fontSize: "0.85rem",
            outline: "none",
          }}
        >
          <option value="ALL">All Dependency Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: "auto" }}>
          Showing {filteredItems.length} of {items.length} dependencies
        </span>
      </div>

      {/* Table Card */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filteredItems.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: 32, textAlign: "center", fontSize: "0.9rem" }}>
            No dependencies found matching your criteria.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderBottom: "1px solid var(--border-color)",
                    color: "var(--text-muted)",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "12px 16px" }}>Source</th>
                  <th style={{ padding: "12px 16px" }}>Target</th>
                  <th style={{ padding: "12px 16px" }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background-color 0.15s",
                    }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {item.source?.name || "N/A"}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {item.source?.type}
                      </span>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {item.target?.name || "N/A"}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {item.target?.type}
                      </span>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          backgroundColor: "rgba(59, 130, 246, 0.12)",
                          color: "#60a5fa",
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      {item.evidenceId ? (
                        <button
                          onClick={() => setSelectedDepId(item.id)}
                          style={{
                            background: "rgba(59, 130, 246, 0.15)",
                            color: "#93c5fd",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          View Evidence
                        </button>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Evidence detail drawer modal */}
      {selectedDepId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setSelectedDepId(null)}
        >
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 580,
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Dependency Evidence</h4>
              <button
                onClick={() => setSelectedDepId(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                }}
              >
                ?
              </button>
            </div>

            {detailLoading ? (
              <Loading label="Loading evidence..." />
            ) : detailData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>RELATIONSHIP</span>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    {detailData.source?.name} ? {detailData.target?.name} ({detailData.type})
                  </div>
                </div>

                {detailData.evidence && detailData.evidence.length > 0 ? (
                  detailData.evidence.map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        padding: 12,
                        borderRadius: 8,
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#93c5fd", marginBottom: 4 }}>
                        ?? {ev.file}:{ev.startLine}-{ev.endLine}
                      </div>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{ev.description}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No line evidence recorded.</p>
                )}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>No evidence details available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
