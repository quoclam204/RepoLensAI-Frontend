"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FileCode2,
  Search,
  ChevronDown,
  ArrowUpRight,
  FileSearch,
  AlertCircle,
  Tag,
  Layers,
} from "lucide-react";
import { getEvidenceList } from "../../lib/api/evidence";
import type { EvidenceDetailResponse, PagedResult } from "../../types";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

interface EvidenceViewProps {
  analysisId: string;
  onOpenEvidenceFile?: (evidence: { file: string; startLine?: number; endLine?: number }) => void;
}

export function EvidenceView({ analysisId, onOpenEvidenceFile }: EvidenceViewProps) {
  const [data, setData] = useState<PagedResult<EvidenceDetailResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All types");
  const [page, setPage] = useState(1);

  const filterOptions = ["All types", "symbol", "dependency", "endpoint", "database"];

  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const typeParam = filterType === "All types" ? undefined : filterType;

    getEvidenceList(analysisId, {
      type: typeParam,
      page,
      pageSize: 50,
    })
      .then((res) => {
        if (!isMounted) return;
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load evidence index");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId, filterType, page, refreshIndex]);

  // Client-side search refinement for description / filePath / symbol
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (!search.trim()) return data.items;
    const term = search.toLowerCase();
    return data.items.filter((item) => {
      const matchFile = item.filePath?.toLowerCase().includes(term);
      const matchSymbol = item.symbol?.toLowerCase().includes(term);
      const matchDesc = item.description?.toLowerCase().includes(term);
      const matchType = item.evidenceType?.toLowerCase().includes(term);
      return matchFile || matchSymbol || matchDesc || matchType;
    });
  }, [data, search]);

  return (
    <div className="evidence-panel" style={{ width: "100%", minHeight: 650 }}>
      {/* Panel Heading */}
      <div className="panel-heading">
        <div>
          <div className="eyebrow">Source index &amp; verification</div>
          <h2 style={{ color: "var(--foreground)" }}>Verifiable Evidence</h2>
        </div>
        <span className="result-count">
          {data ? `${filteredItems.length} of ${data.totalCount} results` : "Loading..."}
        </span>
      </div>

      {/* Controls: Search & Filter */}
      <div className="evidence-controls">
        <label className="control-search">
          <Search size={14} aria-hidden="true" />
          <input
            aria-label="Search evidence"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files, symbols, excerpts, or types..."
          />
        </label>

        <label className="filter-select">
          <span className="sr-only">Filter by type</span>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
          >
            {filterOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "All types" ? "All types" : opt.toUpperCase()}
              </option>
            ))}
          </select>
          <ChevronDown size={13} aria-hidden="true" />
        </label>
      </div>

      {/* State Rendering */}
      {loading ? (
        <div className="workspace-empty" role="status">
          <div className="loading-ring" />
          <strong style={{ color: "var(--foreground)" }}>Loading repository evidence</strong>
          <p>Querying verified source files and symbol indexes...</p>
        </div>
      ) : error ? (
        <div style={{ padding: 24 }}>
          <ErrorMessage message={error} onRetry={() => setRefreshIndex((i) => i + 1)} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="workspace-empty compact">
          <span className="state-icon">
            <FileSearch size={18} aria-hidden="true" />
          </span>
          <strong style={{ color: "var(--foreground)" }}>No matching evidence found</strong>
          <p>
            {search
              ? "Try adjusting your search terms or filter."
              : "No evidence items have been indexed for this repository."}
          </p>
        </div>
      ) : (
        <div className="evidence-list">
          {filteredItems.map((item) => {
            const hasRange = item.startLine && item.endLine;
            const rangeText = hasRange ? `Lines ${item.startLine}–${item.endLine}` : "Full file";

            return (
              <article key={item.id} className="evidence-row">
                <div className="evidence-icon">
                  <FileCode2 size={14} aria-hidden="true" />
                </div>

                <div className="evidence-row-main">
                  <div className="evidence-row-top">
                    <span className="type-badge">{item.evidenceType}</span>
                    {item.symbol && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "monospace",
                          color: "var(--accent)",
                          background: "#1c1926",
                          padding: "2px 6px",
                          borderRadius: 3,
                          border: "1px solid #36304b",
                        }}
                      >
                        {item.symbol}
                      </span>
                    )}
                  </div>

                  <strong title={item.filePath}>{item.filePath}</strong>

                  <div className="source-meta">
                    <span>{rangeText}</span>
                    {item.analysisId && <span>Analysis: {item.analysisId.slice(0, 8)}</span>}
                  </div>

                  {item.description && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#9b97a6",
                        fontSize: "11px",
                        lineHeight: 1.55,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                </div>

                {onOpenEvidenceFile && (
                  <button
                    className="open-source"
                    title={`Inspect ${item.filePath} in Files explorer`}
                    aria-label={`Open source ${item.filePath}`}
                    onClick={() =>
                      onOpenEvidenceFile({
                        file: item.filePath,
                        startLine: item.startLine,
                        endLine: item.endLine,
                      })
                    }
                  >
                    <ArrowUpRight size={15} />
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {data && data.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 18px",
            borderTop: "1px solid var(--line)",
            fontSize: "11px",
            color: "var(--subtle)",
          }}
        >
          <span>
            Page {data.page} of {data.totalPages}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="secondary-button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ height: 28, fontSize: "10px" }}
            >
              Previous
            </button>
            <button
              className="secondary-button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{ height: 28, fontSize: "10px" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
