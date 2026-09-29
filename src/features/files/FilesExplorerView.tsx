import React, { useEffect, useState } from "react";
import { getFileContent, getFiles } from "../../lib/api/files";
import type { FileContentResponse, FileItem, PagedResult } from "../../types";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { Button } from "../../components/ui/Button";

interface FilesExplorerViewProps {
  analysisId: string;
  initialHighlight?: { filePath?: string; startLine?: number; endLine?: number };
}

export function FilesExplorerView({ analysisId, initialHighlight }: FilesExplorerViewProps) {
  const [data, setData] = useState<PagedResult<FileItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<FileContentResponse | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const [highlightRange, setHighlightRange] = useState<{ start: number; end: number } | null>(
    initialHighlight?.startLine && initialHighlight?.endLine
      ? { start: initialHighlight.startLine, end: initialHighlight.endLine }
      : null
  );

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getFiles(analysisId, { pageSize: 150 })
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);

          // If initialHighlight provided, auto-select matching file
          if (initialHighlight?.filePath && res.items?.length) {
            const match = res.items.find(
              (f) => f.path.toLowerCase() === initialHighlight.filePath?.toLowerCase()
            );
            if (match) {
              setSelectedFileId(match.id);
            }
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load files");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId, initialHighlight]);

  useEffect(() => {
    if (!selectedFileId) {
      setFileContent(null);
      return;
    }

    let isMounted = true;
    setContentLoading(true);
    setContentError(null);

    getFileContent(analysisId, selectedFileId)
      .then((res) => {
        if (isMounted) {
          setFileContent(res);
          setContentLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setContentError(err instanceof Error ? err.message : "Failed to load file content");
          setContentLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId, selectedFileId]);

  if (loading) {
    return <Loading label="Loading repository files..." style={{ padding: "60px 0" }} />;
  }

  if (error) {
    return <ErrorMessage message={error} style={{ margin: "20px 0" }} />;
  }

  const items = data?.items || [];
  const filtered = items.filter((f) =>
    !search ? true : f.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search Bar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Filter files by path (e.g. Program.cs)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            fontSize: "0.85rem",
            minWidth: 320,
            outline: "none",
          }}
        />
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {filtered.length} of {items.length} files
        </span>
      </div>

      {/* Split View: File Tree/List & Code Viewer */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedFileId ? "360px 1fr" : "1fr",
          gap: 16,
          minHeight: 520,
        }}
      >
        {/* Files List */}
        <Card style={{ padding: 0, overflow: "hidden", maxHeight: 650, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: "10px 16px",
              backgroundColor: "var(--bg-secondary)",
              borderBottom: "1px solid var(--border-color)",
              fontWeight: 600,
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            REPOSITORY FILES
          </div>

          <div style={{ overflowY: "auto", flexGrow: 1 }}>
            {filtered.length === 0 ? (
              <p style={{ color: "var(--text-muted)", padding: 20, fontSize: "0.85rem" }}>
                No files found.
              </p>
            ) : (
              filtered.map((file) => {
                const isSelected = selectedFileId === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => {
                      setSelectedFileId(file.id);
                      setHighlightRange(null);
                    }}
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "rgba(59, 130, 246, 0.15)" : "transparent",
                      borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      transition: "background-color 0.15s",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? "#93c5fd" : "var(--text-primary)",
                        wordBreak: "break-all",
                      }}
                    >
                      {file.path}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <span>{file.language || "text"}</span>
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Code Content Viewer */}
        {selectedFileId && (
          <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: 650 }}>
            {/* Viewer Header */}
            <div
              style={{
                padding: "10px 16px",
                backgroundColor: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {fileContent?.path || "Loading file..."}
                </span>
                {fileContent && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    ({fileContent.lineCount} lines)
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {fileContent && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(fileContent.content)}
                  >
                    Copy
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFileId(null)}
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Viewer Body: Plain text with Line Numbers */}
            <div style={{ overflow: "auto", flexGrow: 1, backgroundColor: "#070b14", padding: "12px 0" }}>
              {contentLoading ? (
                <Loading label="Reading source file..." />
              ) : contentError ? (
                <ErrorMessage message={contentError} style={{ margin: 16 }} />
              ) : fileContent ? (
                <pre
                  style={{
                    margin: 0,
                    fontSize: "0.82rem",
                    lineHeight: "1.6",
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {fileContent.content.split("\n").map((line, idx) => {
                    const lineNum = idx + 1;
                    const isHighlighted =
                      highlightRange &&
                      lineNum >= highlightRange.start &&
                      lineNum <= highlightRange.end;

                    return (
                      <div
                        key={lineNum}
                        style={{
                          display: "flex",
                          backgroundColor: isHighlighted ? "rgba(59, 130, 246, 0.2)" : "transparent",
                          borderLeft: isHighlighted ? "3px solid #3b82f6" : "3px solid transparent",
                          padding: "0 12px",
                        }}
                      >
                        <span
                          style={{
                            width: 44,
                            userSelect: "none",
                            color: isHighlighted ? "#93c5fd" : "#475569",
                            textAlign: "right",
                            marginRight: 16,
                            flexShrink: 0,
                          }}
                        >
                          {lineNum}
                        </span>
                        <code
                          style={{
                            color: isHighlighted ? "#f8fafc" : "#cbd5e1",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                          }}
                        >
                          {line || " "}
                        </code>
                      </div>
                    );
                  })}
                </pre>
              ) : null}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
