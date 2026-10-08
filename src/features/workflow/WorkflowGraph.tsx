"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  useViewport,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";

import { WorkflowNode } from "./WorkflowNode";
import { WorkflowEdge } from "./WorkflowEdge";
import {
  WorkflowNodeData,
  WorkflowEdgeData,
  SwimlaneConfig,
} from "./types";
import {
  SunIcon,
  MoonIcon,
  MaximizeIcon,
  MinimizeIcon,
} from "./WorkflowIcons";

/**
 * Custom node & edge types registration for React Flow
 */
const nodeTypes = {
  workflowNode: WorkflowNode,
};

const edgeTypes = {
  workflowEdge: WorkflowEdge,
};

/**
 * 6 Swimlanes configuration
 */
const SWIMLANES: SwimlaneConfig[] = [
  {
    id: "lane-1",
    numberPrefix: "01",
    title: "Developer",
    y: 50,
    height: 105,
  },
  {
    id: "lane-2",
    numberPrefix: "02",
    title: "Continuous Integration",
    y: 175,
    height: 110,
  },
  {
    id: "lane-3",
    numberPrefix: "03",
    title: "Release Governance",
    y: 305,
    height: 110,
  },
  {
    id: "lane-4",
    numberPrefix: "04",
    title: "Production Environment",
    y: 435,
    height: 110,
  },
  {
    id: "lane-5",
    numberPrefix: "05",
    title: "Release Communication",
    y: 565,
    height: 110,
  },
  {
    id: "lane-6",
    numberPrefix: "EX",
    title: "Failure + Rollback",
    y: 695,
    height: 125,
    isFailureLane: true,
  },
];

/**
 * Swimlanes Layer that moves and scales seamlessly with React Flow's viewport
 */
function SwimlanesOverlay({ isDark }: { isDark: boolean }) {
  const { x, y, zoom } = useViewport();

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-0"
      style={{
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        transformOrigin: "0 0",
      }}
    >
      {/* 3 Top Milestones */}
      <div className="absolute top-2 left-[230px] font-mono text-xs font-semibold text-slate-400 dark:text-slate-400">
        Change
      </div>
      <div className="absolute top-2 left-[480px] font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        Build + verify
      </div>
      <div className="absolute top-2 left-[730px] font-mono text-xs font-semibold text-amber-600 dark:text-amber-500">
        Promote + observe
      </div>

      {/* 6 Swimlane bounding boxes */}
      {SWIMLANES.map((lane) => {
        const isFailure = lane.isFailureLane;
        return (
          <div
            key={lane.id}
            style={{
              top: `${lane.y}px`,
              left: "80px",
              width: "860px",
              height: `${lane.height}px`,
            }}
            className={`
              absolute rounded-2xl border transition-colors duration-200
              ${
                isFailure
                  ? "border-dashed border-rose-400/50 dark:border-rose-500/40 bg-rose-500/[0.02] dark:bg-rose-500/[0.03]"
                  : "border-dashed border-slate-300 dark:border-slate-800/80 bg-slate-500/[0.015]"
              }
            `}
          >
            {/* Swimlane Label */}
            <div
              className={`
                absolute top-2.5 left-4 font-mono text-[11px] font-medium tracking-wider
                ${
                  isFailure
                    ? "text-rose-500 dark:text-rose-400 font-bold"
                    : "text-slate-400 dark:text-slate-500"
                }
              `}
            >
              {lane.numberPrefix} / {lane.title}
            </div>

            {/* Sub-box: Recovery Path inside Failure + Rollback lane */}
            {isFailure && (
              <div
                style={{
                  top: "22px",
                  left: "440px",
                  width: "390px",
                  height: "85px",
                }}
                className="absolute rounded-xl border border-dashed border-rose-400/40 dark:border-rose-500/30"
              >
                <span className="absolute top-1.5 left-2.5 font-mono text-[9px] text-rose-400 dark:text-rose-400/80 font-semibold tracking-wider">
                  Recovery path
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 10 Raw Nodes specification matching the release architecture
 */
const INITIAL_NODES_DATA: Node<WorkflowNodeData>[] = [
  {
    id: "node-commit",
    type: "workflowNode",
    position: { x: 100, y: 80 },
    data: {
      label: "Commit",
      subtitle: "signed change",
      role: "user-ui",
      iconName: "commit",
      passport: {
        categoryTag: "FRONTEND",
        path: "Developer > Change",
        slug: "signed_commit",
        upstreamCount: 0,
        downstreamCount: 9,
        outgoing: [{ name: "Pull Request", relation: "connects to", targetId: "node-pull-request" }],
        incoming: [],
      },
    },
  },
  {
    id: "node-pull-request",
    type: "workflowNode",
    position: { x: 270, y: 80 },
    data: {
      label: "Pull Request",
      subtitle: "reviewed diff",
      role: "user-ui",
      iconName: "pull-request",
      passport: {
        categoryTag: "FRONTEND",
        path: "Developer > Change",
        slug: "pull_request",
        upstreamCount: 1,
        downstreamCount: 8,
        outgoing: [{ name: "Build", relation: "merge", targetId: "node-build" }],
        incoming: [{ name: "Commit", relation: "connects from", sourceId: "node-commit" }],
      },
    },
  },
  {
    id: "node-build",
    type: "workflowNode",
    position: { x: 375, y: 205 },
    data: {
      label: "Build",
      subtitle: "locked inputs",
      statusBadge: "reproducible",
      role: "agent-logic",
      iconName: "build",
      passport: {
        categoryTag: "CI/CD",
        path: "Continuous Integration > Build",
        slug: "build_artifact",
        upstreamCount: 2,
        downstreamCount: 7,
        outgoing: [{ name: "Quality Gates", relation: "artifact to scan", targetId: "node-quality-gates" }],
        incoming: [{ name: "Pull Request", relation: "merge", sourceId: "node-pull-request" }],
      },
    },
  },
  {
    id: "node-quality-gates",
    type: "workflowNode",
    position: { x: 540, y: 205 },
    data: {
      label: "Quality Gates",
      subtitle: "test + scan",
      role: "policy",
      iconName: "quality-gates",
      passport: {
        categoryTag: "GOVERNANCE",
        path: "Continuous Integration > Gates",
        slug: "quality_gates",
        upstreamCount: 3,
        downstreamCount: 6,
        outgoing: [
          { name: "Approve", relation: "passed gate", targetId: "node-approve" },
          { name: "Stop Release", relation: "red / failed", targetId: "node-stop-release" },
        ],
        incoming: [{ name: "Build", relation: "scan target", sourceId: "node-build" }],
      },
    },
  },
  {
    id: "node-approve",
    type: "workflowNode",
    position: { x: 630, y: 335 },
    data: {
      label: "Approve",
      subtitle: "release owner",
      role: "policy",
      iconName: "approve",
      passport: {
        categoryTag: "GOVERNANCE",
        path: "Release Governance > Signoff",
        slug: "release_approve",
        upstreamCount: 4,
        downstreamCount: 5,
        outgoing: [{ name: "Deploy", relation: "promote", targetId: "node-deploy" }],
        incoming: [{ name: "Quality Gates", relation: "passed", sourceId: "node-quality-gates" }],
      },
    },
  },
  {
    id: "node-deploy",
    type: "workflowNode",
    position: { x: 630, y: 465 },
    data: {
      label: "Deploy",
      subtitle: "canary 10%",
      role: "cloud-service",
      iconName: "deploy",
      passport: {
        categoryTag: "INFRASTRUCTURE",
        path: "Production Environment > Canary",
        slug: "canary_deploy",
        upstreamCount: 5,
        downstreamCount: 4,
        outgoing: [{ name: "Verify", relation: "canary traffic", targetId: "node-verify" }],
        incoming: [
          { name: "Approve", relation: "promoted", sourceId: "node-approve" },
          { name: "Rollback", relation: "restore", sourceId: "node-rollback" },
        ],
      },
    },
  },
  {
    id: "node-verify",
    type: "workflowNode",
    position: { x: 795, y: 465 },
    data: {
      label: "Verify",
      subtitle: "smoke + SLO",
      role: "agent-logic",
      iconName: "verify",
      passport: {
        categoryTag: "OBSERVABILITY",
        path: "Production Environment > Observe",
        slug: "verify_metrics",
        upstreamCount: 6,
        downstreamCount: 3,
        outgoing: [
          { name: "Announce", relation: "healthy", targetId: "node-announce" },
          { name: "Rollback", relation: "slo breach", targetId: "node-rollback" },
        ],
        incoming: [{ name: "Deploy", relation: "traffic", sourceId: "node-deploy" }],
      },
    },
  },
  {
    id: "node-announce",
    type: "workflowNode",
    position: { x: 795, y: 595 },
    data: {
      label: "Announce",
      subtitle: "status + notes",
      role: "external-system",
      iconName: "announce",
      passport: {
        categoryTag: "COMMUNICATION",
        path: "Release Communication > Broadcast",
        slug: "broadcast_notes",
        upstreamCount: 7,
        downstreamCount: 0,
        outgoing: [],
        incoming: [{ name: "Verify", relation: "healthy", sourceId: "node-verify" }],
      },
    },
  },
  {
    id: "node-stop-release",
    type: "workflowNode",
    position: { x: 375, y: 725 },
    data: {
      label: "Stop Release",
      subtitle: "gate failed",
      role: "policy",
      iconName: "stop-release",
      passport: {
        categoryTag: "FAILURE_HANDLER",
        path: "Failure > Abort",
        slug: "stop_release",
        upstreamCount: 4,
        downstreamCount: 0,
        outgoing: [],
        incoming: [{ name: "Quality Gates", relation: "red", sourceId: "node-quality-gates" }],
      },
    },
  },
  {
    id: "node-rollback",
    type: "workflowNode",
    position: { x: 650, y: 725 },
    data: {
      label: "Rollback",
      subtitle: "last good image",
      role: "tool-action",
      iconName: "rollback",
      passport: {
        categoryTag: "RECOVERY",
        path: "Failure > Recovery",
        slug: "rollback_image",
        upstreamCount: 7,
        downstreamCount: 2,
        outgoing: [{ name: "Deploy", relation: "restore", targetId: "node-deploy" }],
        incoming: [{ name: "Verify", relation: "rollback triggered", sourceId: "node-verify" }],
      },
    },
  },
];

/**
 * CI/CD Process Edges
 */
const INITIAL_EDGES_DATA: Edge<WorkflowEdgeData>[] = [
  {
    id: "edge-commit-pr",
    source: "node-commit",
    target: "node-pull-request",
    sourceHandle: "source-right",
    targetHandle: "target-left",
    type: "workflowEdge",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
    data: { strokeColor: "#94a3b8", strokeWidth: 2 },
  },
  {
    id: "edge-pr-build",
    source: "node-pull-request",
    target: "node-build",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    type: "workflowEdge",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
    data: {
      label: "merge",
      labelVariant: "emerald",
      strokeColor: "#10b981",
      strokeWidth: 2.5,
    },
  },
  {
    id: "edge-build-gates",
    source: "node-build",
    target: "node-quality-gates",
    sourceHandle: "source-right",
    targetHandle: "target-left",
    type: "workflowEdge",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
    data: { strokeColor: "#94a3b8", strokeWidth: 2 },
  },
  {
    id: "edge-gates-approve",
    source: "node-quality-gates",
    target: "node-approve",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    type: "workflowEdge",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
    data: { strokeColor: "#10b981", strokeWidth: 2.5 },
  },
  {
    id: "edge-gates-stop",
    source: "node-quality-gates",
    target: "node-stop-release",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    type: "workflowEdge",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f43f5e" },
    data: {
      label: "red",
      labelVariant: "rose",
      isDashed: true,
      strokeColor: "#f43f5e",
      strokeWidth: 2,
    },
  },
  {
    id: "edge-approve-deploy",
    source: "node-approve",
    target: "node-deploy",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    type: "workflowEdge",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f43f5e" },
    data: {
      isDashed: true,
      strokeColor: "#f43f5e",
      strokeWidth: 2,
    },
  },
  {
    id: "edge-deploy-verify",
    source: "node-deploy",
    target: "node-verify",
    sourceHandle: "source-right",
    targetHandle: "target-left",
    type: "workflowEdge",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
    data: { strokeColor: "#94a3b8", strokeWidth: 2 },
  },
  {
    id: "edge-verify-announce",
    source: "node-verify",
    target: "node-announce",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    type: "workflowEdge",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
    data: {
      label: "healthy",
      labelVariant: "emerald",
      strokeColor: "#10b981",
      strokeWidth: 2.5,
    },
  },
  {
    id: "edge-verify-rollback",
    source: "node-verify",
    target: "node-rollback",
    sourceHandle: "source-right",
    targetHandle: "target-right",
    type: "workflowEdge",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f43f5e" },
    data: {
      isDashed: true,
      strokeColor: "#f43f5e",
      strokeWidth: 2,
    },
  },
  {
    id: "edge-rollback-deploy",
    source: "node-rollback",
    target: "node-deploy",
    sourceHandle: "source-top",
    targetHandle: "target-bottom",
    type: "workflowEdge",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6" },
    data: {
      label: "restore",
      labelVariant: "indigo",
      isDashed: true,
      strokeColor: "#8b5cf6",
      strokeWidth: 2,
    },
  },
];

/**
 * Inner Workflow Canvas with interactive state handlers
 */
function WorkflowCanvas() {
  const [isDark, setIsDark] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("node-pull-request");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);

  const { zoomIn, zoomOut, setViewport, getViewport } = useReactFlow();

  const handleZoomChange = (delta: number) => {
    if (delta > 0) {
      zoomIn({ duration: 200 });
      setZoomLevel((prev) => Math.min(prev + 10, 150));
    } else {
      zoomOut({ duration: 200 });
      setZoomLevel((prev) => Math.max(prev - 10, 50));
    }
  };

  const handleResetZoom = () => {
    setViewport({ x: 40, y: 20, zoom: 0.95 }, { duration: 300 });
    setZoomLevel(100);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Node selection & popover actions
  const handleSelectNode = useCallback((id: string) => {
    setSelectedNodeId((prev) => (prev === id ? null : id));
  }, []);

  const handleClosePassport = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Multi-branch hover focus logic
  const handleHoverStart = useCallback((id: string) => {
    setHoveredNodeId(id);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Compute active nodes with callbacks and selection states
  const nodes = useMemo(() => {
    return INITIAL_NODES_DATA.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isSelected: node.id === selectedNodeId,
        isHovered: node.id === hoveredNodeId,
        onSelectNode: handleSelectNode,
        onClosePassport: handleClosePassport,
        onHoverStart: handleHoverStart,
        onHoverEnd: handleHoverEnd,
      },
    }));
  }, [selectedNodeId, hoveredNodeId, handleSelectNode, handleClosePassport, handleHoverStart, handleHoverEnd]);

  // Compute edges with multi-branch highlight glow
  const edges = useMemo(() => {
    return INITIAL_EDGES_DATA.map((edge) => {
      // If the source node is hovered or selected, glow all outgoing branches!
      const isOutgoingHighlighted = hoveredNodeId ? edge.source === hoveredNodeId : false;

      return {
        ...edge,
        data: {
          ...edge.data,
          isHighlighted: isOutgoingHighlighted,
        },
      };
    });
  }, [hoveredNodeId]);

  return (
    <div
      ref={containerRef}
      className={`
        relative w-full h-[880px] rounded-2xl overflow-hidden border transition-colors duration-300 font-sans
        ${
          isDark
            ? "dark bg-[#0b1118] border-slate-800 text-slate-100"
            : "bg-[#f8fafc] border-slate-200 text-slate-900"
        }
      `}
    >
      {/* Top Header Bar */}
      <header
        className={`
          flex items-center justify-between px-5 py-3 border-b backdrop-blur-md z-30 relative
          ${
            isDark
              ? "border-slate-800/80 bg-[#0b1118]/80 text-white"
              : "border-slate-200/80 bg-white/80 text-slate-900"
          }
        `}
      >
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          <h2 className="font-semibold text-sm tracking-tight font-mono">
            Release Delivery Workflow
          </h2>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Mode Toggle */}
          <button
            onClick={() => setIsDark((prev) => !prev)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors
              ${
                isDark
                  ? "border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
                  : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800"
              }
            `}
            title="Toggle Dark / Light Theme"
          >
            {isDark ? <SunIcon size={13} className="text-amber-400" /> : <MoonIcon size={13} className="text-slate-600" />}
            <span>{isDark ? "Dark" : "Light"}</span>
          </button>

          {/* Mode Switcher */}
          <div
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono
              ${
                isDark
                  ? "border-slate-800 bg-slate-900/40 text-slate-300"
                  : "border-slate-200 bg-slate-100 text-slate-700"
              }
            `}
          >
            <span>Classic</span>
            <span className="text-[10px] text-slate-500">▼</span>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Live</span>
          </div>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className={`
              p-1.5 rounded-lg border transition-colors
              ${
                isDark
                  ? "border-slate-800 hover:bg-slate-800 text-slate-300"
                  : "border-slate-200 hover:bg-slate-100 text-slate-600"
              }
            `}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <MinimizeIcon size={13} /> : <MaximizeIcon size={13} />}
          </button>

          {/* Export button */}
          <button className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold shadow-sm hover:opacity-90">
            Export <span className="text-[10px]">▼</span>
          </button>
        </div>
      </header>

      {/* Main React Flow Graph Canvas */}
      <div className="w-full h-[calc(100%-110px)] relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultViewport={{ x: 30, y: 15, zoom: 0.95 }}
          minZoom={0.4}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
          fitViewOptions={{ padding: 0.2 }}
        >
          {/* Dot Grid Background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color={isDark ? "#1e293b" : "#cbd5e1"}
          />

          {/* Swimlanes Background Overlay */}
          <SwimlanesOverlay isDark={isDark} />
        </ReactFlow>
      </div>

      {/* Bottom Footer with Legend & Action Bar */}
      <footer
        className={`
          absolute bottom-0 left-0 right-0 h-[52px] px-5 flex items-center justify-between border-t backdrop-blur-md z-30
          ${
            isDark
              ? "border-slate-800/80 bg-[#0b1118]/80 text-slate-200"
              : "border-slate-200/80 bg-white/80 text-slate-800"
          }
        `}
      >
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="font-bold text-slate-400">Legend</span>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-400 bg-cyan-500/10 text-[11px]">
            <span>User UI</span>
            <span className="text-[9px] px-1 bg-cyan-500/20 rounded font-bold">2</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[11px]">
            <span>Agent logic</span>
            <span className="text-[9px] px-1 bg-emerald-500/20 rounded font-bold">2</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-rose-500/40 text-rose-400 bg-rose-500/10 text-[11px]">
            <span>Policy</span>
            <span className="text-[9px] px-1 bg-rose-500/20 rounded font-bold">3</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-orange-500/40 text-orange-400 bg-orange-500/10 text-[11px]">
            <span>Tool action</span>
            <span className="text-[9px] px-1 bg-orange-500/20 rounded font-bold">1</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-500/40 text-amber-400 bg-amber-500/10 text-[11px]">
            <span>Cloud service</span>
            <span className="text-[9px] px-1 bg-amber-500/20 rounded font-bold">1</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-500/40 text-slate-400 bg-slate-500/10 text-[11px]">
            <span>External system</span>
            <span className="text-[9px] px-1 bg-slate-500/20 rounded font-bold">1</span>
          </div>
        </div>

        {/* Viewport & Lens Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-700 hover:bg-slate-800/60 text-slate-300">
            <span>↗</span> PATH
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-700 hover:bg-slate-800/60 text-slate-300">
            <span>◎</span> LENS
          </button>

          <div className="flex items-center border border-slate-700 rounded overflow-hidden">
            <button
              onClick={() => handleZoomChange(-10)}
              className="px-2 py-1 hover:bg-slate-800/60 text-slate-300 font-bold"
            >
              -
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-1 text-[11px] hover:bg-slate-800/60 text-slate-400"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={() => handleZoomChange(10)}
              className="px-2 py-1 hover:bg-slate-800/60 text-slate-300 font-bold"
            >
              +
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Main Exported Component wrapped with ReactFlowProvider
 */
export function WorkflowGraph() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}

export default WorkflowGraph;
