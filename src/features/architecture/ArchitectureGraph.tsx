"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  RotateCcw,
  Layers,
  ArrowUpRight,
  X,
  FileCode2,
  GitBranch,
  Network,
  Share2,
} from "lucide-react";
import { getArchitecture } from "../../lib/api/architecture";
import type { ArchitectureEdge, ArchitectureNode, ArchitectureResponse } from "../../types";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

interface ArchitectureGraphProps {
  analysisId: string;
  onOpenArchify?: () => void;
  onOpenEvidenceFile?: (evidence: { file: string; startLine?: number; endLine?: number }) => void;
}

interface PositionedNode extends ArchitectureNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ArchitectureGraph({
  analysisId,
  onOpenArchify,
  onOpenEvidenceFile,
}: ArchitectureGraphProps) {
  const [data, setData] = useState<ArchitectureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 30, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getArchitecture(analysisId)
      .then((res) => {
        if (!isMounted) return;
        setData(res);
        setLoading(false);
        if (res.nodes.length > 0) {
          setSelectedNodeId((current) => current ?? res.nodes[0].id);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load architecture");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId, refreshIndex]);

  // Unique node types
  const nodeTypes = useMemo(() => {
    if (!data?.nodes) return [];
    return Array.from(new Set(data.nodes.map((n) => n.type)));
  }, [data]);

  // Filtered nodes (by type and search)
  const filteredNodes = useMemo(() => {
    if (!data?.nodes) return [];
    return data.nodes.filter((n) => {
      const matchType = typeFilter === "ALL" || n.type === typeFilter;
      const matchSearch =
        !search.trim() ||
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.path.toLowerCase().includes(search.toLowerCase()) ||
        n.type.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [data, typeFilter, search]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Filtered edges
  const filteredEdges = useMemo(() => {
    if (!data?.edges) return [];
    return data.edges.filter(
      (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );
  }, [data, filteredNodeIds]);

  // Position calculation
  const positionedNodes = useMemo<PositionedNode[]>(() => {
    if (filteredNodes.length === 0) return [];

    const nodeWidth = 200;
    const nodeHeight = 68;
    const colSpacing = 270;
    const rowSpacing = 110;

    const cols = Math.max(1, Math.ceil(Math.sqrt(filteredNodes.length * 1.5)));

    return filteredNodes.map((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...node,
        x: 50 + col * colSpacing,
        y: 50 + row * rowSpacing,
        width: nodeWidth,
        height: nodeHeight,
      };
    });
  }, [filteredNodes]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    for (const n of positionedNodes) {
      map.set(n.id, n);
    }
    return map;
  }, [positionedNodes]);

  const selectedNode = useMemo(() => {
    return selectedNodeId ? data?.nodes.find((n) => n.id === selectedNodeId) : null;
  }, [selectedNodeId, data]);

  const outgoingEdges = useMemo(() => {
    if (!selectedNodeId || !data?.edges) return [];
    return data.edges.filter((e) => e.source === selectedNodeId);
  }, [selectedNodeId, data]);

  const incomingEdges = useMemo(() => {
    if (!selectedNodeId || !data?.edges) return [];
    return data.edges.filter((e) => e.target === selectedNodeId);
  }, [selectedNodeId, data]);

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(2.2, +(s + 0.15).toFixed(2)));
  const handleZoomOut = () => setScale((s) => Math.max(0.35, +(s - 0.15).toFixed(2)));
  const handleResetZoom = () => {
    setScale(1);
    setTranslate({ x: 30, y: 30 });
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTranslate({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Focus on node
  const handleFocusNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const node = nodeMap.get(nodeId);
    if (node) {
      setTranslate({
        x: Math.max(20, 240 - node.x * scale),
        y: Math.max(20, 180 - node.y * scale),
      });
    }
  };

  if (loading) {
    return (
      <div className="workspace-empty" role="status" style={{ minHeight: 400 }}>
        <div className="loading-ring" />
        <strong style={{ color: "var(--foreground)" }}>Rendering architecture topology</strong>
        <p>Extracting component relationships and boundary maps...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <ErrorMessage message={error} onRetry={() => setRefreshIndex((i) => i + 1)} />
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="workspace-empty" style={{ minHeight: 360 }}>
        <span className="state-icon">
          <Layers size={18} />
        </span>
        <strong style={{ color: "var(--foreground)" }}>No architectural nodes detected</strong>
        <p>The analyzer did not detect project or component boundaries in this repository.</p>
      </div>
    );
  }

  return (
    <div className="architecture-layout" style={{ marginTop: 0 }}>
      {/* Left: Interactive Canvas */}
      <section className="graph-panel" aria-label="Architecture Graph Canvas">
        {/* Toolbar */}
        <div className="graph-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div className="graph-search">
              <Search size={14} aria-hidden="true" />
              <input
                aria-label="Search architecture nodes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes, paths, types..."
              />
            </div>

            <label className="filter-select" style={{ minWidth: 120 }}>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="ALL">All Types ({data.nodes.length})</option>
                {nodeTypes.map((t) => (
                  <option key={t} value={t}>
                    {t} ({data.nodes.filter((n) => n.type === t).length})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="graph-tools">
            <button
              className="graph-tool"
              onClick={handleZoomIn}
              title="Zoom In"
              aria-label="Zoom in"
            >
              <Plus size={14} />
            </button>
            <span className="zoom-readout">{Math.round(scale * 100)}%</span>
            <button
              className="graph-tool"
              onClick={handleZoomOut}
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <Minus size={14} />
            </button>
            <button
              className="graph-tool"
              onClick={handleResetZoom}
              title="Reset View"
              aria-label="Reset zoom"
            >
              <RotateCcw size={13} />
            </button>

            {onOpenArchify && (
              <button
                className="secondary-button"
                onClick={onOpenArchify}
                style={{ height: 29, fontSize: "10px", marginLeft: 4 }}
                title="Open Archify C4 Diagram"
              >
                <Layers size={13} />
                <span>Archify C4</span>
              </button>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div
          className="graph-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? "grabbing" : "grab", userSelect: "none" }}
        >
          {/* Subtle Grid */}
          <div className="graph-grid" />

          {/* SVG Connection Lines */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            <defs>
              <marker
                id="arch-arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8b8995" />
              </marker>
              <marker
                id="arch-arrow-active"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#c5b6ff" />
              </marker>
            </defs>

            <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
              {filteredEdges.map((edge) => {
                const src = nodeMap.get(edge.source);
                const tgt = nodeMap.get(edge.target);
                if (!src || !tgt) return null;

                const isConnectedToSelected =
                  edge.source === selectedNodeId || edge.target === selectedNodeId;

                const x1 = src.x + src.width / 2;
                const y1 = src.y + src.height / 2;
                const x2 = tgt.x + tgt.width / 2;
                const y2 = tgt.y + tgt.height / 2;

                const dx = x2 - x1;
                const dy = y2 - y1;
                const cx1 = x1 + dx * 0.45;
                const cy1 = y1;
                const cx2 = x1 + dx * 0.55;
                const cy2 = y2;

                return (
                  <path
                    key={edge.id}
                    d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={isConnectedToSelected ? "var(--accent)" : "#3b3945"}
                    strokeWidth={isConnectedToSelected ? 2 : 1}
                    strokeDasharray={edge.type.toLowerCase().includes("indirect") ? "4,4" : undefined}
                    opacity={isConnectedToSelected ? 0.95 : 0.4}
                    markerEnd={isConnectedToSelected ? "url(#arch-arrow-active)" : "url(#arch-arrow)"}
                  />
                );
              })}
            </g>
          </svg>

          {/* Node Cards */}
          <div
            style={{
              position: "absolute",
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transformOrigin: "0 0",
              pointerEvents: "none",
            }}
          >
            {positionedNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;

              return (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                  }}
                  className={`architecture-node ${isSelected ? "selected" : ""}`}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    pointerEvents: "auto",
                    cursor: "pointer",
                  }}
                >
                  <span className="node-kind">{node.type}</span>
                  <strong title={node.name}>{node.name}</strong>
                  <small title={node.path}>{node.path || "No path"}</small>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="graph-legend">
            <span>
              <span className="legend-dot" /> Component
            </span>
            <span>
              <span className="legend-dot service" /> Service
            </span>
            <span>
              <span className="legend-dot data" /> Data / Entity
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="graph-footer">
          <span>
            {positionedNodes.length} nodes rendered • Click to inspect • Drag to pan
          </span>
          <span>{filteredEdges.length} connections</span>
        </div>
      </section>

      {/* Right: Node Details Inspector */}
      <aside className="node-panel" aria-label="Node Details">
        <div className="node-panel-header">
          <div>
            <div className="eyebrow">Node Inspector</div>
            <h2>Details</h2>
          </div>
          {selectedNode && (
            <button
              className="close-state"
              onClick={() => setSelectedNodeId(null)}
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {!selectedNode ? (
          <div className="inspector-empty">
            <span className="state-icon">
              <Network size={16} />
            </span>
            <strong>No node selected</strong>
            <p>Click any component on the canvas to inspect its metadata, source file, and dependencies.</p>
          </div>
        ) : (
          <div className="node-details">
            <div className="selected-node-title">
              <span className="type-badge">{selectedNode.type}</span>
              <h3>{selectedNode.name}</h3>
            </div>

            <div className="detail-row">
              <span>Path</span>
              <strong style={{ fontFamily: "monospace", fontSize: "10px" }}>
                {selectedNode.path || "Not specified"}
              </strong>
            </div>

            {selectedNode.path && onOpenEvidenceFile && (
              <div style={{ marginTop: 10 }}>
                <button
                  className="secondary-button"
                  style={{ width: "100%", justifyContent: "center", fontSize: "10px", height: 30 }}
                  onClick={() =>
                    onOpenEvidenceFile({
                      file: selectedNode.path,
                    })
                  }
                >
                  <FileCode2 size={13} />
                  <span>Inspect in Files</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            )}

            {/* Outgoing relationships */}
            <div className="detail-section">
              <div className="detail-label">
                <span>Depends On ({outgoingEdges.length})</span>
              </div>
              {outgoingEdges.length === 0 ? (
                <p className="detail-muted">No outgoing dependencies.</p>
              ) : (
                <div className="relationship-list">
                  {outgoingEdges.map((edge) => {
                    const targetNode = data?.nodes.find((n) => n.id === edge.target);
                    return (
                      <div
                        key={edge.id}
                        className="relationship-item"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleFocusNode(edge.target)}
                        title="Click to focus"
                      >
                        <Share2 size={13} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{targetNode ? targetNode.name : edge.target}</strong>
                          <small>Relation: {edge.type}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Incoming relationships */}
            <div className="detail-section">
              <div className="detail-label">
                <span>Depended By ({incomingEdges.length})</span>
              </div>
              {incomingEdges.length === 0 ? (
                <p className="detail-muted">No components depend on this node.</p>
              ) : (
                <div className="relationship-list">
                  {incomingEdges.map((edge) => {
                    const sourceNode = data?.nodes.find((n) => n.id === edge.source);
                    return (
                      <div
                        key={edge.id}
                        className="relationship-item"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleFocusNode(edge.source)}
                        title="Click to focus"
                      >
                        <GitBranch size={13} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{sourceNode ? sourceNode.name : edge.source}</strong>
                          <small>Relation: {edge.type}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
