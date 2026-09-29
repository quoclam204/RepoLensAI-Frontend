import React, { useEffect, useState } from "react";
import { getEndpointDetail, getEndpoints } from "../../lib/api/endpoints";
import type { EndpointDetailResponse, EndpointItem, PagedResult } from "../../types";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

interface EndpointsViewProps {
  analysisId: string;
}

export function EndpointsView({ analysisId }: EndpointsViewProps) {
  const [data, setData] = useState<PagedResult<EndpointItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [routeSearch, setRouteSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EndpointDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getEndpoints(analysisId, { pageSize: 100 })
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load API endpoints");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId]);

  useEffect(() => {
    if (!selectedEndpointId) {
      setDetail(null);
      return;
    }
    let isMounted = true;
    setDetailLoading(true);
    getEndpointDetail(analysisId, selectedEndpointId)
      .then((res) => {
        if (isMounted) {
          setDetail(res);
          setDetailLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setDetailLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId, selectedEndpointId]);

  if (loading) {
    return <Loading label="Loading API endpoints..." style={{ padding: "60px 0" }} />;
  }

  if (error) {
    return <ErrorMessage message={error} style={{ margin: "20px 0" }} />;
  }

  const items = data?.items || [];
  const methods = Array.from(new Set(items.map((i) => i.method?.toUpperCase()).filter(Boolean)));

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !routeSearch ||
      item.route.toLowerCase().includes(routeSearch.toLowerCase()) ||
      item.controller?.toLowerCase().includes(routeSearch.toLowerCase()) ||
      item.action?.toLowerCase().includes(routeSearch.toLowerCase());
    const matchesMethod =
      methodFilter === "ALL" || item.method.toUpperCase() === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const getMethodBadgeStyle = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" };
      case "POST":
        return { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.3)" };
      case "PUT":
        return { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" };
      case "DELETE":
        return { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" };
      case "PATCH":
        return { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc", border: "rgba(168, 85, 247, 0.3)" };
      default:
        return { bg: "rgba(100, 116, 139, 0.15)", text: "#94a3b8", border: "rgba(100, 116, 139, 0.3)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search and filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Filter route or controller name..."
          value={routeSearch}
          onChange={(e) => setRouteSearch(e.target.value)}
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
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
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
          <option value="ALL">All Methods</option>
          {methods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: "auto" }}>
          Showing {filteredItems.length} of {items.length} endpoints
        </span>
      </div>

      {/* Endpoints Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filteredItems.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: 32, textAlign: "center", fontSize: "0.9rem" }}>
            No HTTP endpoints found.
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
                  <th style={{ padding: "12px 16px" }}>Method</th>
                  <th style={{ padding: "12px 16px" }}>Route</th>
                  <th style={{ padding: "12px 16px" }}>Controller & Action</th>
                  <th style={{ padding: "12px 16px" }}>Project</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const badgeStyle = getMethodBadgeStyle(item.method);
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background-color 0.15s",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.text,
                            border: `1px solid ${badgeStyle.border}`,
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {item.method.toUpperCase()}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <code
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            fontSize: "0.9rem",
                          }}
                        >
                          {item.route}
                        </code>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          {item.controller ? `${item.controller}.${item.action || "Action"}` : "N/A"}
                        </div>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                          {item.project?.name || "N/A"}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedEndpointId(item.id)}
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
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Endpoint Detail Modal */}
      {selectedEndpointId && (
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
          onClick={() => setSelectedEndpointId(null)}
        >
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 600,
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Endpoint Specification</h4>
              <button
                onClick={() => setSelectedEndpointId(null)}
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
              <Loading label="Loading endpoint details..." />
            ) : detail ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      ...getMethodBadgeStyle(detail.method),
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontWeight: 700,
                      fontSize: "0.8rem",
                    }}
                  >
                    {detail.method}
                  </span>
                  <code style={{ fontSize: "1rem", fontWeight: 600 }}>{detail.route}</code>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PROJECT & CONTROLLER</span>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {detail.project} ?? {detail.controller}.{detail.action}
                  </div>
                </div>

                {detail.source?.file && (
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>SOURCE FILE</span>
                    <div style={{ fontSize: "0.85rem", color: "#93c5fd" }}>
                      ?? {detail.source.file} {detail.source.symbol ? `(${detail.source.symbol})` : ""}
                    </div>
                  </div>
                )}

                {detail.evidence && detail.evidence.length > 0 && (
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                      TRACEABLE EVIDENCE
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {detail.evidence.map((ev, i) => (
                        <div
                          key={i}
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            padding: 10,
                            borderRadius: 6,
                            fontSize: "0.8rem",
                          }}
                        >
                          <div style={{ fontWeight: 600, color: "#60a5fa" }}>
                            {ev.file}:{ev.startLine}-{ev.endLine}
                          </div>
                          {ev.reason && <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>{ev.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>No details found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
