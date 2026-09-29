import React, { useEffect, useMemo, useRef, useState } from "react";
import { getArchitecture } from "../../lib/api/architecture";
import type { ArchitectureEdge, ArchitectureNode, ArchitectureResponse } from "../../types";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

interface ArchitectureGraphProps {
  analysisId: string;
}

interface PositionedNode extends ArchitectureNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ArchitectureGraph({ analysisId }: ArchitectureGraphProps) {
  const [data, setData] = useState<ArchitectureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getArchitecture(analysisId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load architecture");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId]);

  // Unique node types
  const nodeTypes = useMemo(() => {
    if (!data?.nodes) return [];
    return Array.from(new Set(data.nodes.map((n) => n.type)));
  }, [data]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    if (!data?.nodes) return [];
    if (typeFilter === "ALL") return data.nodes;
    return data.nodes.filter((n) => n.type === typeFilter);
  }, [data, typeFilter]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Filtered edges
  const filteredEdges = useMemo(() => {
    if (!data?.edges) return [];
    return data.edges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));
  }, [data, filteredNodeIds]);

  // Layout positioning calculation
  const positionedNodes = useMemo<PositionedNode[]>(() => {
    if (filteredNodes.length === 0) return [];

    const nodeWidth = 200;
    const nodeHeight = 70;
    const colSpacing = 280;
    const rowSpacing = 110;

    const cols = Math.max(1, Math.ceil(Math.sqrt(filteredNodes.length * 1.5)));

    return filteredNodes.map((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...node,
        x: 60 + col * colSpacing,
        y: 60 + row * rowSpacing,
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
  const handleZoomIn = () => setScale((s) => Math.min(2.5, s + 0.2));
  const handleZoomOut = () => setScale((s) => Math.max(0.3, s - 0.2));
  const handleResetZoom = () => {
    setScale(1);
    setTranslate({ x: 40, y: 40 });
  };

  // Drag pan handlers
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

  const getNodeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("project")) return { bg: "#1e3a8a", border: "#3b82f6", text: "#bfdbfe" };
    if (t.includes("service")) return { bg: "#064e3b", border: "#10b981", text: "#a7f3d0" };
    if (t.includes("controller") || t.includes("api")) return { bg: "#4c1d95", border: "#8b5cf6", text: "#ddd6fe" };
    if (t.includes("database") || t.includes("entity")) return { bg: "#701a75", border: "#d946ef", text: "#f5d0fe" };
    return { bg: "#1e293b", border: "#475569", text: "#cbd5e1" };
  };

  if (loading) {
    return <Loading label="Loading architecture graph..." style={{ padding: "60px 0" }} />;
  }

  if (error) {
    return <ErrorMessage message={error} style={{ margin: "20px 0" }} />;
  }

  if (!data || data.nodes.length === 0) {
    return (
      <Card style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>
          No architectural nodes detected for this repository.
        </p>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controls toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Filter by Node Type:
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: "6px 12px",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              fontSize: "0.85rem",
              outline: "none",
            }}
          >
            <option value="ALL">All Types ({data.nodes.length})</option>
            {nodeTypes.map((type) => (
              <option key={type} value={type}>
                {type} ({data.nodes.filter((n) => n.type === type).length})
              </option>
            ))}
          </select>

          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing {filteredNodes.length} nodes, {filteredEdges.length} edges
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              padding: "6px 12px",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              padding: "6px 12px",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            -
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset View"
            style={{
              padding: "6px 12px",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Reset View
          </button>
        </div>
      </div>

      {/* Main Canvas & Details Split */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedNode ? "1fr 340px" : "1fr",
          gap: 16,
          height: 600,
        }}
      >
        {/* SVG Graph View */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            backgroundColor: "#0d1321",
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            overflow: "hidden",
            cursor: isDragging ? "grabbing" : "grab",
            position: "relative",
            userSelect: "none",
          }}
        >
          <svg
            width="100%"
            height="100%"
            style={{ display: "block" }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
              </marker>
              <marker
                id="arrowhead-active"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
              </marker>
            </defs>

            <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
              {/* Render edges */}
              {filteredEdges.map((edge) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (!source || !target) return null;

                const startX = source.x + source.width / 2;
                const startY = source.y + source.height / 2;
                const endX = target.x + target.width / 2;
                const endY = target.y + target.height / 2;

                const isConnected =
                  selectedNodeId === edge.source || selectedNodeId === edge.target;

                return (
                  <g key={edge.id}>
                    <line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke={isConnected ? "#3b82f6" : "#334155"}
                      strokeWidth={isConnected ? 2.5 : 1.5}
                      strokeDasharray={edge.type.toLowerCase().includes("reference") ? undefined : "4 2"}
                      markerEnd={isConnected ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                    />
                    {/* Edge label */}
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 - 4}
                      fill={isConnected ? "#93c5fd" : "#64748b"}
                      fontSize={10}
                      textAnchor="middle"
                      style={{ pointerEvents: "none" }}
                    >
                      {edge.type}
                    </text>
                  </g>
                );
              })}

              {/* Render nodes */}
              {positionedNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const color = getNodeColor(node.type);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(isSelected ? null : node.id);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <rect
                      width={node.width}
                      height={node.height}
                      rx={8}
                      fill={isSelected ? "#1e293b" : color.bg}
                      stroke={isSelected ? "#60a5fa" : color.border}
                      strokeWidth={isSelected ? 2.5 : 1}
                      filter={isSelected ? "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))" : undefined}
                    />
                    {/* Type badge text */}
                    <text
                      x={12}
                      y={20}
                      fill={color.text}
                      fontSize={10}
                      fontWeight="bold"
                      style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
                    >
                      {node.type}
                    </text>
                    {/* Node name */}
                    <text
                      x={12}
                      y={40}
                      fill="#f8fafc"
                      fontSize={13}
                      fontWeight="600"
                    >
                      {node.name.length > 20 ? `${node.name.substring(0, 18)}...` : node.name}
                    </text>
                    {/* Node path */}
                    <text
                      x={12}
                      y={56}
                      fill="#94a3b8"
                      fontSize={10}
                    >
                      {node.path ? (node.path.length > 24 ? `...${node.path.slice(-22)}` : node.path) : ""}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <Card
            style={{
              padding: 20,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#93c5fd",
                    textTransform: "uppercase",
                  }}
                >
                  {selectedNode.type}
                </span>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: 2 }}>{selectedNode.name}</h4>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                ?
              </button>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>PATH</span>
              <code style={{ fontSize: "0.8rem", color: "#e2e8f0", wordBreak: "break-all" }}>
                {selectedNode.path || "N/A"}
              </code>
            </div>

            {/* Outgoing relationships */}
            <div>
              <h5 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 8, color: "#93c5fd" }}>
                Depends On ({outgoingEdges.length})
              </h5>
              {outgoingEdges.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No outgoing dependencies</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {outgoingEdges.map((e) => {
                    const targetNode = data?.nodes.find((n) => n.id === e.target);
                    return (
                      <div
                        key={e.id}
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          padding: "8px 10px",
                          borderRadius: 6,
                          fontSize: "0.8rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontWeight: 600 }}>{targetNode?.name || e.target}</span>
                          <span style={{ color: "#60a5fa" }}>{e.type}</span>
                        </div>
                        {e.evidence && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                            ?? {e.evidence.file}:{e.evidence.startLine}-{e.evidence.endLine}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Incoming relationships */}
            <div>
              <h5 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 8, color: "#34d399" }}>
                Referenced By ({incomingEdges.length})
              </h5>
              {incomingEdges.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No incoming references</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {incomingEdges.map((e) => {
                    const srcNode = data?.nodes.find((n) => n.id === e.source);
                    return (
                      <div
                        key={e.id}
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          padding: "8px 10px",
                          borderRadius: 6,
                          fontSize: "0.8rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontWeight: 600 }}>{srcNode?.name || e.source}</span>
                          <span style={{ color: "#34d399" }}>{e.type}</span>
                        </div>
                        {e.evidence && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                            ?? {e.evidence.file}:{e.evidence.startLine}-{e.evidence.endLine}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
