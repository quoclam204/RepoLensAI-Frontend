"use client";

import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { analysisGateway, usesMockAnalysis } from "@/services/analysis-gateway";
import type { VisualGraph, VisualGraphNode } from "@/types/api";

type GraphKind = "architecture" | "dependencies";
type GraphNodeData = VisualGraphNode;
type FlowNode = Node<GraphNodeData>;

const copy = {
  architecture: {
    eyebrow: "System map",
    title: "Architecture",
    description: "Explore projects and the relationships detected between them.",
    empty: "No architecture nodes were returned for this analysis.",
  },
  dependencies: {
    eyebrow: "Relationship map",
    title: "Dependencies",
    description: "Inspect the direction and type of dependencies across the repository.",
    empty: "No dependencies were returned for this analysis.",
  },
} satisfies Record<GraphKind, Record<string, string>>;

function layoutNodes(nodes: VisualGraphNode[]): FlowNode[] {
  const columns = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  return nodes.map((node, index) => ({
    id: node.id,
    position: {
      x: (index % columns) * 260,
      y: Math.floor(index / columns) * 150 + (index % 2) * 18,
    },
    data: node,
    style: {
      width: 190,
      border: "1px solid #b8cdc5",
      borderRadius: 12,
      padding: 13,
      color: "#10231f",
      background: "#ffffff",
      boxShadow: "0 8px 22px rgba(20, 55, 45, .09)",
      fontSize: 12,
      fontWeight: 750,
    },
  }));
}

function layoutEdges(graph: VisualGraph): Edge[] {
  return graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.relationship,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#0b8f68" },
    style: { stroke: "#0b8f68", strokeWidth: 1.5 },
    labelStyle: { fill: "#52645e", fontSize: 10, fontWeight: 650 },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9 },
  }));
}

function displayValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export function RepositoryGraph({ analysisId, kind }: { analysisId: string; kind: GraphKind }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<VisualGraphNode | null>(null);
  const [totalRelationships, setTotalRelationships] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const content = copy[kind];

  useEffect(() => {
    let active = true;

    analysisGateway[kind](analysisId)
      .then((graph) => {
        if (!active) return;
        setNodes(layoutNodes(graph.nodes));
        setEdges(layoutEdges(graph));
        setTotalRelationships(graph.totalRelationships);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setNodes([]);
        setEdges([]);
        setError(reason instanceof Error ? reason.message : "Unable to load graph data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [analysisId, kind, reloadKey, setEdges, setNodes]);

  const nodeKinds = useMemo(
    () => [...new Set(nodes.map((node) => node.data.kind))],
    [nodes],
  );
  const onNodeClick: NodeMouseHandler<FlowNode> = useCallback((_, node) => {
    setSelectedNode(node.data);
  }, []);
  const reload = () => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setReloadKey((value) => value + 1);
  };

  return (
    <main className="workspace-page graph-page">
      <div className="page-shell">
        <div className="graph-heading">
          <div>
            <p className="eyebrow">{content.eyebrow}</p>
            <h1>{content.title}</h1>
            <p>{content.description}</p>
          </div>
          <div className="graph-stats" aria-label="Graph statistics">
            <span><strong>{nodes.length}</strong> nodes</span>
            <span><strong>{totalRelationships}</strong> relationships</span>
            {usesMockAnalysis && <em>Demo data</em>}
          </div>
        </div>

        {loading && (
          <section className="state-panel graph-state" aria-live="polite">
            <span className="spinner" />
            <h2>Building graph</h2>
            <p>Loading nodes and relationships from the analysis result.</p>
          </section>
        )}

        {!loading && error && (
          <section className="state-panel graph-state" role="alert">
            <span className="state-symbol">!</span>
            <h2>Graph unavailable</h2>
            <p>{error}</p>
            <div className="state-actions">
              <button className="button primary" type="button" onClick={reload}>Try again</button>
            </div>
          </section>
        )}

        {!loading && !error && nodes.length === 0 && (
          <section className="state-panel graph-state">
            <span className="state-symbol">0</span>
            <h2>Nothing to visualize</h2>
            <p>{content.empty}</p>
          </section>
        )}

        {!loading && !error && nodes.length > 0 && (
          <section className="graph-workspace">
            <div className="graph-canvas" aria-label={`${content.title} interactive graph`}>
              <ReactFlow<FlowNode, Edge>
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodesConnectable={false}
                deleteKeyCode={null}
                fitView
                fitViewOptions={{ padding: 0.24 }}
                minZoom={0.25}
                maxZoom={1.8}
              >
                <Background color="#c9d8d2" gap={22} size={1} />
                <MiniMap pannable zoomable nodeColor="#0b8f68" maskColor="rgba(243,247,245,.72)" />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>

            <aside className="graph-sidebar">
              <div className="graph-legend">
                <p className="eyebrow">Legend</p>
                {nodeKinds.map((nodeKind) => <span key={nodeKind}><i />{nodeKind}</span>)}
                <span><b />Directed relationship</span>
              </div>

              <div className="node-detail">
                <p className="eyebrow">Node details</p>
                {selectedNode ? (
                  <>
                    <h2>{selectedNode.label}</h2>
                    <dl>
                      <div><dt>Type</dt><dd>{selectedNode.kind}</dd></div>
                      <div><dt>ID</dt><dd>{selectedNode.id}</dd></div>
                      {selectedNode.path && <div><dt>Path</dt><dd>{selectedNode.path}</dd></div>}
                      {Object.entries(selectedNode.metadata ?? {}).map(([key, value]) => (
                        <div key={key}><dt>{key}</dt><dd>{displayValue(value)}</dd></div>
                      ))}
                    </dl>
                  </>
                ) : (
                  <p className="empty-copy">Select a node in the graph to inspect its API-provided details.</p>
                )}
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
