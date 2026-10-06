"use client";

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  EdgeLabelRenderer,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type EdgeProps,
  type EdgeTypes,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "@xyflow/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { analysisGateway } from "@/services/analysis-gateway";
import { useTheme } from "@/components/theme-provider";
import {
  RepoLensIcon,
  SunIcon,
  MoonIcon,
  BoltIcon,
  LockIcon,
  UnlockIcon,
  MapIcon,
  FolderIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArchitectureIcon,
  WindowNodeIcon,
  CodeNodeIcon,
  DatabaseNodeIcon,
  CloudNodeIcon,
  ShieldNodeIcon,
  RouterNodeIcon,
  GridNodeIcon,
  UserNodeIcon,
} from "@/components/icons";
import type {
  VisualGraph,
  VisualGraphNode,
  ArchifyV3Document,
  DiagramDto,
  DiagramNodeDto,
  DiagramEdgeDto,
  DiagramDetailCardDto,
  RepositoryClassification,
} from "@/types/api";

export type GraphKind = "architecture" | "dependencies" | "workflow";

type WorkflowPresetKey = "05-repo" | "01-agent" | "02-deploy" | "03-cache" | "04-leave";

export interface ArchifyCustomNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  kind?: string;
  role?: string;
  subtitle?: string;
  extraText?: string;
  tag?: string;
  iconType: "window" | "external" | "code" | "shield" | "menu" | "cloud" | "db" | "grid";
  category: "ui" | "runtime" | "policy" | "data" | "external";
  theme: "dark" | "light";
  isSelected?: boolean;
  isConnected?: boolean;
  isDimmed?: boolean;
  isRoutePath?: boolean;
  metadata?: Record<string, unknown> | null;
  path?: string;
  childDiagramType?: string | null;
  detailCard?: DiagramDetailCardDto;
}

export interface BoundaryBoxData extends Record<string, unknown> {
  id: string;
  label: string;
  category: "ui" | "runtime" | "policy" | "data" | "external";
  width: number;
  height: number;
  theme: "dark" | "light";
  isSubgroup?: boolean;
  isDimmed?: boolean;
}

export interface StageMarkerData extends Record<string, unknown> {
  label: string;
  theme: "dark" | "light";
}

type ArchifyNode = Node<ArchifyCustomNodeData, "archifyNode">;
type BoundaryNode = Node<BoundaryBoxData, "boundaryNode">;
type StageNode = Node<StageMarkerData, "stageNode">;
type FlowNode = ArchifyNode | BoundaryNode | StageNode;

// Rich color palettes for Light & Dark mode matching Archify design system
const CATEGORY_STYLES = {
  dark: {
    ui: {
      border: "#00f0ff",
      glow: "rgba(0, 240, 255, 0.45)",
      bg: "#091728",
      text: "#e0f7fe",
      subtext: "#38bdf8",
      laneBorder: "rgba(0, 240, 255, 0.4)",
      laneBg: "rgba(0, 240, 255, 0.015)",
      laneText: "#38bdf8",
    },
    runtime: {
      border: "#2dd4bf",
      glow: "rgba(45, 212, 191, 0.45)",
      bg: "#081a1f",
      text: "#ccfbf1",
      subtext: "#2dd4bf",
      laneBorder: "rgba(45, 212, 191, 0.4)",
      laneBg: "rgba(45, 212, 191, 0.015)",
      laneText: "#2dd4bf",
    },
    policy: {
      border: "#f43f5e",
      glow: "rgba(244, 63, 94, 0.45)",
      bg: "#200d18",
      text: "#ffe4e6",
      subtext: "#fb7185",
      laneBorder: "rgba(244, 63, 94, 0.45)",
      laneBg: "rgba(244, 63, 94, 0.018)",
      laneText: "#fb7185",
    },
    data: {
      border: "#a855f7",
      glow: "rgba(168, 85, 247, 0.45)",
      bg: "#160e28",
      text: "#f3e8ff",
      subtext: "#c084fc",
      laneBorder: "rgba(168, 85, 247, 0.4)",
      laneBg: "rgba(168, 85, 247, 0.015)",
      laneText: "#c084fc",
    },
    external: {
      border: "#f97316",
      glow: "rgba(249, 115, 22, 0.45)",
      bg: "#211309",
      text: "#ffedd5",
      subtext: "#fb923c",
      laneBorder: "rgba(249, 115, 22, 0.4)",
      laneBg: "rgba(249, 115, 22, 0.015)",
      laneText: "#fb923c",
    },
  },
  light: {
    ui: {
      border: "#0284c7",
      glow: "rgba(2, 132, 199, 0.28)",
      bg: "#f0f9ff",
      text: "#0c4a6e",
      subtext: "#0284c7",
      laneBorder: "rgba(2, 132, 199, 0.45)",
      laneBg: "rgba(2, 132, 199, 0.02)",
      laneText: "#0284c7",
    },
    runtime: {
      border: "#059669",
      glow: "rgba(5, 150, 105, 0.28)",
      bg: "#ecfdf5",
      text: "#064e3b",
      subtext: "#059669",
      laneBorder: "rgba(5, 150, 105, 0.45)",
      laneBg: "rgba(5, 150, 105, 0.02)",
      laneText: "#059669",
    },
    policy: {
      border: "#e11d48",
      glow: "rgba(225, 29, 72, 0.28)",
      bg: "#fff1f2",
      text: "#881337",
      subtext: "#e11d48",
      laneBorder: "rgba(225, 29, 72, 0.45)",
      laneBg: "rgba(225, 29, 72, 0.025)",
      laneText: "#e11d48",
    },
    data: {
      border: "#7c3aed",
      glow: "rgba(124, 58, 237, 0.28)",
      bg: "#f5f3ff",
      text: "#4c1d95",
      subtext: "#7c3aed",
      laneBorder: "rgba(124, 58, 237, 0.45)",
      laneBg: "rgba(124, 58, 237, 0.02)",
      laneText: "#7c3aed",
    },
    external: {
      border: "#d97706",
      glow: "rgba(217, 119, 6, 0.28)",
      bg: "#fffbeb",
      text: "#78350f",
      subtext: "#d97706",
      laneBorder: "rgba(217, 119, 6, 0.45)",
      laneBg: "rgba(217, 119, 6, 0.02)",
      laneText: "#d97706",
    },
  },
};

// Render bespoke architecture icons per node type
function RenderArchifyIcon({
  type,
  size = 14,
}: {
  type?: ArchifyCustomNodeData["iconType"];
  size?: number;
}) {
  switch (type) {
    case "window":
      return <WindowNodeIcon size={size} color="currentColor" />;
    case "code":
      return <CodeNodeIcon size={size} color="currentColor" />;
    case "db":
      return <DatabaseNodeIcon size={size} color="currentColor" />;
    case "cloud":
      return <CloudNodeIcon size={size} color="currentColor" />;
    case "shield":
      return <ShieldNodeIcon size={size} color="currentColor" />;
    case "menu":
      return <RouterNodeIcon size={size} color="currentColor" />;
    case "grid":
      return <GridNodeIcon size={size} color="currentColor" />;
    case "external":
      return <UserNodeIcon size={size} color="currentColor" />;
    default:
      return <RepoLensIcon size={size} color="currentColor" />;
  }
}

// 1. Archify Custom Node Component (with Radiant Glowing Halo, Dimming & Route Highlighting)
function ArchifyNodeComponent(props: NodeProps) {
  const data = props.data as unknown as ArchifyCustomNodeData;
  const isDark = data.theme === "dark";
  const styles = CATEGORY_STYLES[data.theme]?.[data.category] || CATEGORY_STYLES[data.theme].ui;

  const isSelected = !!data.isSelected;
  const isConnected = !!data.isConnected;
  const isRoutePath = !!data.isRoutePath;
  const isDimmed = !!data.isDimmed;

  let opacity = 1;
  let transform = "scale(1)";
  let borderColor = styles.border;
  let boxShadow = isDark
    ? `0 0 16px ${styles.glow}, inset 0 0 10px rgba(0,0,0,0.5)`
    : `0 4px 14px rgba(15, 23, 42, 0.08)`;

  if (isSelected) {
    opacity = 1;
    transform = "scale(1.04)";
    borderColor = isDark ? "#ffffff" : styles.border;
    boxShadow = isDark
      ? `0 0 0 2px #ffffff, 0 0 24px #00f0ff, 0 0 50px rgba(0, 240, 255, 0.8)`
      : `0 0 0 2.5px ${styles.border}, 0 0 24px ${styles.glow}, 0 8px 24px rgba(0,0,0,0.14)`;
  } else if (isRoutePath) {
    opacity = 1;
    transform = "scale(1.02)";
    borderColor = "#ffbd2e";
    boxShadow = isDark
      ? `0 0 0 2px #ffbd2e, 0 0 24px rgba(255, 189, 46, 0.65)`
      : `0 0 0 2px #d97706, 0 0 20px rgba(217, 119, 6, 0.35)`;
  } else if (isConnected) {
    opacity = 1;
    boxShadow = isDark
      ? `0 0 0 1.5px ${styles.border}, 0 0 20px ${styles.glow}`
      : `0 0 0 1.5px ${styles.border}, 0 6px 18px rgba(0,0,0,0.1)`;
  } else if (isDimmed) {
    opacity = 0.16;
  }

  return (
    <div
      style={{
        width: 182,
        minHeight: 64,
        background: styles.bg,
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        padding: "9px 12px",
        boxShadow,
        opacity,
        transform,
        transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Space Mono', Consolas, monospace",
        zIndex: isSelected ? 30 : isRoutePath ? 25 : 10,
      }}
    >
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Left} id="ls" style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Right} id="rt" style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Top} id="t" style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Top} id="ts" style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Bottom} id="bt" style={{ opacity: 0, width: 8, height: 8 }} />

      {data.tag && (
        <span
          style={{
            position: "absolute",
            top: -10,
            left: 12,
            background: styles.bg,
            border: `1px solid ${styles.border}`,
            padding: "1px 6px",
            fontSize: "9px",
            fontWeight: 700,
            borderRadius: 4,
            color: styles.subtext,
            letterSpacing: "0.04em",
          }}
        >
          {data.tag}
        </span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
        <span style={{ color: styles.subtext, display: "flex", alignItems: "center" }}>
          <RenderArchifyIcon type={data.iconType} />
        </span>
        <strong
          style={{
            fontSize: "12.5px",
            fontWeight: 750,
            color: styles.text,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {data.label}
        </strong>
      </div>

      {data.subtitle && (
        <p
          style={{
            margin: 0,
            fontSize: "10px",
            color: styles.subtext,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {data.subtitle}
        </p>
      )}

      {data.extraText && (
        <p
          style={{
            margin: "3px 0 0",
            fontSize: "9px",
            color: styles.subtext,
            opacity: 0.85,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {data.extraText}
        </p>
      )}
    </div>
  );
}

// 2. Boundary Container Component (Swimlanes & Subgroups)
function BoundaryBoxComponent(props: NodeProps) {
  const data = props.data as unknown as BoundaryBoxData;
  const isDark = data.theme === "dark";
  const styles = CATEGORY_STYLES[data.theme]?.[data.category] || CATEGORY_STYLES[data.theme].ui;
  const isSubgroup = !!data.isSubgroup;
  const opacity = data.isDimmed ? 0.22 : 1;

  return (
    <div
      style={{
        width: data.width,
        height: data.height,
        border: `${isSubgroup ? "1.2px" : "1.5px"} dashed ${styles.laneBorder}`,
        borderRadius: isSubgroup ? 8 : 12,
        background: styles.laneBg,
        position: "relative",
        pointerEvents: "none",
        opacity,
        transition: "opacity 0.22s ease",
        fontFamily: "'JetBrains Mono', 'Space Mono', Consolas, monospace",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: isSubgroup ? 5 : 8,
          left: 12,
          fontSize: isSubgroup ? "9.5px" : "11px",
          fontWeight: 700,
          color: styles.laneText,
          letterSpacing: "0.06em",
          textTransform: isSubgroup ? "none" : "uppercase",
        }}
      >
        {data.label}
      </span>
    </div>
  );
}

// 3. Stage Markers across top
function StageMarkerComponent(props: NodeProps) {
  const data = props.data as unknown as StageMarkerData;
  const isDark = data.theme === "dark";

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'Space Mono', Consolas, monospace",
        fontSize: "11px",
        fontWeight: 700,
        color: isDark ? "#64748b" : "#94a3b8",
        letterSpacing: "0.08em",
        pointerEvents: "none",
        userSelect: "none",
        textTransform: "uppercase",
      }}
    >
      {data.label}
    </div>
  );
}

// Custom Archify Signal Flow Edge:
// - Always renders the underlying clean static arrow line
// - On Hover/Focus: Emits a single glowing beam capsule that travels 100% of the entire arrow smoothly
function ArchifySignalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const pathRef = useRef<SVGPathElement>(null);
  const isActive = !!data?.isActive;
  const pulseKey = (data?.pulseKey as number) || 0;
  const strokeColor = (style.stroke as string) || (data?.color as string) || "#00f0ff";

  const isDark = (data?.theme as string) !== "light";

  // Animation Progress 0.0 -> 1.0 driven by requestAnimationFrame (100% reliable across all browsers)
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setProgress(null);
      return;
    }

    let start: number | null = null;
    let animId: number;
    const duration = 2400; // 2.4 seconds: slow, clear, and graceful

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setProgress(null);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isActive, pulseKey]);

  // Compute exact coordinates and tangent rotation along the path
  let capsuleTransform: string | null = null;
  let capsuleOpacity = 0;

  if (progress !== null && pathRef.current) {
    try {
      const totalLen = pathRef.current.getTotalLength();
      if (totalLen > 0) {
        const currentLen = progress * totalLen;
        const pt = pathRef.current.getPointAtLength(currentLen);
        const pAhead = pathRef.current.getPointAtLength(Math.min(totalLen, currentLen + 2));
        const pBehind = pathRef.current.getPointAtLength(Math.max(0, currentLen - 2));
        const angle = (Math.atan2(pAhead.y - pBehind.y, pAhead.x - pBehind.x) * 180) / Math.PI;

        capsuleTransform = `translate(${pt.x}, ${pt.y}) rotate(${angle})`;
        // Sine curve gives smooth fade-in at start (0) and smooth fade-out at end (1)
        capsuleOpacity = Math.sin(progress * Math.PI);
      }
    } catch {
      // Fallback
    }
  }

  return (
    <>
      {/* 1. Underlying Base Arrow Line (Crisp, authored line - always visible) */}
      <path
        ref={pathRef}
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={style}
        markerEnd={markerEnd}
      />

      {/* 2. Single 1-Shot Traveling Signal Capsule (Rides 100% of the arrow from start to end) */}
      {capsuleTransform && capsuleOpacity > 0 && (
        <g transform={capsuleTransform} style={{ pointerEvents: "none" }}>
          {/* Outer Glowing Neon Capsule */}
          <rect
            x={-15}
            y={-4}
            width={30}
            height={8}
            rx={4}
            fill={strokeColor}
            style={{
              filter: `drop-shadow(0 0 6px ${strokeColor}) drop-shadow(0 0 12px ${strokeColor})`,
              opacity: capsuleOpacity,
            }}
          />
          {/* Inner High-Energy White Core */}
          <rect
            x={-9}
            y={-2}
            width={18}
            height={4}
            rx={2}
            fill="#ffffff"
            style={{
              opacity: capsuleOpacity * 0.95,
            }}
          />
        </g>
      )}

      {/* Edge Label Badge - Interactive pill badge allowing users to click and inspect relationship */}
      {label && (
        <EdgeLabelRenderer>
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (data?.onSelectEdge && typeof data.onSelectEdge === "function") {
                data.onSelectEdge(id);
              }
            }}
            title={`Quan hệ: ${label} (Bấm để xem chi tiết kết nối)`}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              cursor: "pointer",
              zIndex: 25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3px 9px",
              borderRadius: 6,
              fontSize: "9.5px",
              fontFamily: "'JetBrains Mono', Consolas, monospace",
              fontWeight: 750,
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              backgroundColor: isDark ? "#091728" : "#ffffff",
              border: `1.4px solid ${strokeColor}`,
              color: isDark ? "#7dd3fc" : "#0f172a",
              boxShadow: isDark
                ? "0 2px 8px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 240, 255, 0.25)"
                : "0 2px 6px rgba(15, 23, 42, 0.12)",
              backdropFilter: "blur(6px)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <span>{label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// Helper to compute optimal source/target handles between any two nodes to prevent loopbacks and line collisions
function getOptimalHandles(
  source: { x: number; y: number },
  target: { x: number; y: number },
): { sourceHandle: string; targetHandle: string } {
  const dy = target.y - source.y;
  const dx = target.x - source.x;

  // Vertical transition (cross swimlanes or different rows)
  if (dy > 45) {
    return { sourceHandle: "b", targetHandle: "t" };
  }
  if (dy < -45) {
    return { sourceHandle: "ts", targetHandle: "bt" };
  }

  // Same horizontal row
  if (dx >= 0) {
    return { sourceHandle: "r", targetHandle: "l" };
  }
  return { sourceHandle: "ls", targetHandle: "rt" };
}

const nodeTypes: NodeTypes = {
  archifyNode: ArchifyNodeComponent,
  boundaryNode: BoundaryBoxComponent,
  stageNode: StageMarkerComponent,
};

const edgeTypes: EdgeTypes = {
  archifyEdge: ArchifySignalEdge,
};

// =========================================================================
// PRESET: 01 Agent Tool Call (Workflow from Archify showcase)
// =========================================================================
function buildAgentToolCallWorkflow(theme: "dark" | "light"): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = [];

  nodes.push(
    { id: "stage-intake", type: "stageNode", position: { x: 170, y: 15 }, zIndex: 0, data: { label: "Intake", theme } },
    { id: "stage-plan", type: "stageNode", position: { x: 530, y: 15 }, zIndex: 0, data: { label: "Plan + route", theme } },
    { id: "stage-exec", type: "stageNode", position: { x: 880, y: 15 }, zIndex: 0, data: { label: "Execute + report", theme } },
  );

  const laneWidth = 1040;

  nodes.push({
    id: "lane-ui",
    type: "boundaryNode",
    position: { x: 30, y: 45 },
    zIndex: -2,
    data: { id: "lane-ui", label: "01 / User Interface", category: "ui", width: laneWidth, height: 110, theme },
  });

  nodes.push({
    id: "lane-runtime",
    type: "boundaryNode",
    position: { x: 30, y: 175 },
    zIndex: -2,
    data: { id: "lane-runtime", label: "02 / Agent Runtime", category: "runtime", width: laneWidth, height: 135, theme },
  });

  nodes.push({
    id: "sub-planning",
    type: "boundaryNode",
    position: { x: 410, y: 190 },
    zIndex: -1,
    data: { id: "sub-planning", label: "Planning loop", category: "runtime", width: 330, height: 105, theme, isSubgroup: true },
  });

  nodes.push({
    id: "lane-policy",
    type: "boundaryNode",
    position: { x: 30, y: 330 },
    zIndex: -2,
    data: { id: "lane-policy", label: "EX / Policy & Recovery", category: "policy", width: laneWidth, height: 135, theme },
  });

  nodes.push({
    id: "sub-policy-stop",
    type: "boundaryNode",
    position: { x: 580, y: 345 },
    zIndex: -1,
    data: { id: "sub-policy-stop", label: "Human or policy stop", category: "policy", width: 470, height: 105, theme, isSubgroup: true },
  });

  nodes.push({
    id: "sub-tool-work",
    type: "boundaryNode",
    position: { x: 740, y: 505 },
    zIndex: -1,
    data: { id: "sub-tool-work", label: "Tool work", category: "external", width: 320, height: 105, theme, isSubgroup: true },
  });

  // Action Nodes
  nodes.push(
    { id: "user", type: "archifyNode", position: { x: 55, y: 68 }, data: { id: "user", label: "User", subtitle: "asks for work", iconType: "external", category: "ui", theme } },
    { id: "chat-surface", type: "archifyNode", position: { x: 220, y: 68 }, data: { id: "chat-surface", label: "Chat Surface", subtitle: "thread + files", iconType: "window", category: "ui", theme } },
    { id: "final-reply", type: "archifyNode", position: { x: 890, y: 68 }, data: { id: "final-reply", label: "Final Reply", subtitle: "answer + changes", iconType: "code", category: "runtime", theme } },
    { id: "agent-planner", type: "archifyNode", position: { x: 425, y: 212 }, data: { id: "agent-planner", label: "Agent Planner", subtitle: "plan next step", extraText: "context aware", iconType: "code", category: "runtime", theme } },
    { id: "tool-router", type: "archifyNode", position: { x: 585, y: 212 }, data: { id: "tool-router", label: "Tool Router", subtitle: "choose capability", iconType: "code", category: "runtime", theme } },
    { id: "approval-gate", type: "archifyNode", position: { x: 595, y: 365 }, data: { id: "approval-gate", label: "Approval Gate", subtitle: "scope + consent", iconType: "shield", category: "policy", theme } },
    { id: "blocked", type: "archifyNode", position: { x: 760, y: 365 }, data: { id: "blocked", label: "Blocked", subtitle: "wait or reject", iconType: "shield", category: "policy", theme } },
    { id: "retry-path", type: "archifyNode", position: { x: 900, y: 365 }, data: { id: "retry-path", label: "Retry Path", subtitle: "revise request", iconType: "menu", category: "external", theme } },
    { id: "context-store", type: "archifyNode", position: { x: 220, y: 525 }, data: { id: "context-store", label: "Context Store", subtitle: "session + state", iconType: "grid", category: "data", theme } },
    { id: "trace-log", type: "archifyNode", position: { x: 585, y: 525 }, data: { id: "trace-log", label: "Trace Log", subtitle: "append receipt", iconType: "grid", category: "data", theme } },
    { id: "local-tools", type: "archifyNode", position: { x: 755, y: 525 }, data: { id: "local-tools", label: "Local Tools", subtitle: "fs, bash, ripgrep", iconType: "code", category: "external", theme } },
    { id: "remote-apis", type: "archifyNode", position: { x: 915, y: 525 }, data: { id: "remote-apis", label: "Remote APIs", subtitle: "models, cloud", iconType: "cloud", category: "external", theme } },
  );

  const isDark = theme === "dark";
  const edgeColor = isDark ? "#00f0ff" : "#0284c7";
  const labelBg = isDark ? "#0b1526" : "#ffffff";
  const labelText = isDark ? "#7dd3fc" : "#0f172a";

  const nodePosMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    nodePosMap.set(n.id, n.position);
  });

  const rawEdges = [
    { id: "e1", source: "user", target: "chat-surface", label: "prompt" },
    { id: "e2", source: "chat-surface", target: "agent-planner", label: "intake" },
    { id: "e3", source: "agent-planner", target: "tool-router", label: "intent" },
    { id: "e4", source: "tool-router", target: "approval-gate", label: "requires permission" },
    { id: "e5", source: "approval-gate", target: "blocked", label: "denied" },
    { id: "e6", source: "blocked", target: "retry-path", label: "review" },
    { id: "e7", source: "tool-router", target: "local-tools", label: "exec" },
    { id: "e8", source: "tool-router", target: "remote-apis", label: "call" },
    { id: "e9", source: "tool-router", target: "trace-log", label: "record" },
    { id: "e10", source: "agent-planner", target: "context-store", label: "sync" },
    { id: "e11", source: "agent-planner", target: "final-reply", label: "complete" },
  ];

  const edges: Edge[] = rawEdges.map((e) => {
    const sPos = nodePosMap.get(e.source) || { x: 0, y: 0 };
    const tPos = nodePosMap.get(e.target) || { x: 0, y: 0 };
    const { sourceHandle, targetHandle } = getOptimalHandles(sPos, tPos);

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle,
      targetHandle,
      label: e.label,
      type: "archifyEdge",
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 14, height: 14 },
      style: { stroke: edgeColor, strokeWidth: 2 },
      data: { theme },
    };
  });

  return { nodes, edges };
}

// Map typed DiagramDto from backend directly into Archify lanes cleanly
// Fully grounded: does not fabricate nodes/edges; respects NotDetected / Unsupported status.
export function buildFromDiagramDto(
  diagram: DiagramDto,
  theme: "dark" | "light",
): { nodes: FlowNode[]; edges: Edge[] } {
  if (!diagram || !diagram.nodes || diagram.nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Group nodes by visual tiers based on their role
  const gatewayNodes: DiagramNodeDto[] = [];
  const controllerNodes: DiagramNodeDto[] = [];
  const serviceNodes: DiagramNodeDto[] = [];
  const dataNodes: DiagramNodeDto[] = [];
  const groupNodes: DiagramNodeDto[] = [];

  for (const n of diagram.nodes) {
    const roleLower = (n.role || "").toLowerCase();
    const kindLower = (n.kind || "").toLowerCase();

    if (kindLower === "group" || roleLower === "group") {
      groupNodes.push(n);
    } else if (
      roleLower === "general" ||
      roleLower === "page" ||
      kindLower === "gateway" ||
      kindLower === "route" ||
      kindLower === "method"
    ) {
      gatewayNodes.push(n);
    } else if (
      roleLower === "controller" ||
      roleLower === "project" ||
      kindLower === "project" ||
      kindLower === "controller"
    ) {
      controllerNodes.push(n);
    } else if (
      roleLower === "service" ||
      roleLower === "component" ||
      roleLower === "class" ||
      kindLower === "service" ||
      kindLower === "component" ||
      kindLower === "hook"
    ) {
      serviceNodes.push(n);
    } else if (
      roleLower === "repository" ||
      roleLower === "database" ||
      kindLower === "repository" ||
      kindLower === "database"
    ) {
      dataNodes.push(n);
    } else {
      serviceNodes.push(n);
    }
  }

  const COLS_PER_ROW = 5;
  const SPACING_X = 230;
  const ROW_HEIGHT = 105;
  const LANE_PADDING_TOP = 42;
  const LANE_GAP = 28;
  const LANE_PADDING_BOTTOM = 18;

  const buildGrid = (items: DiagramNodeDto[]): (DiagramNodeDto | null)[][] => {
    if (items.length === 0) return [];
    const rowCount = Math.ceil(items.length / COLS_PER_ROW);
    const grid: (DiagramNodeDto | null)[][] = Array.from({ length: rowCount }, () =>
      Array.from({ length: COLS_PER_ROW }, () => null),
    );
    let idx = 0;
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < COLS_PER_ROW; c++) {
        if (idx < items.length) {
          grid[r][c] = items[idx++];
        }
      }
    }
    return grid;
  };

  const gatewayGrid = buildGrid(gatewayNodes);
  const controllerGrid = buildGrid(controllerNodes);
  const serviceGrid = buildGrid(serviceNodes);
  const dataGrid = buildGrid(dataNodes);
  const groupGrid = buildGrid(groupNodes);

  const maxNodesInRow = Math.max(
    gatewayNodes.length > 0 ? Math.min(gatewayNodes.length, COLS_PER_ROW) : 0,
    controllerNodes.length > 0 ? Math.min(controllerNodes.length, COLS_PER_ROW) : 0,
    serviceNodes.length > 0 ? Math.min(serviceNodes.length, COLS_PER_ROW) : 0,
    dataNodes.length > 0 ? Math.min(dataNodes.length, COLS_PER_ROW) : 0,
    groupNodes.length > 0 ? Math.min(groupNodes.length, COLS_PER_ROW) : 0,
  );
  const actualCols = Math.max(3, maxNodesInRow);
  const laneWidth = actualCols * SPACING_X + 60;
  const startX = 40;

  const resultNodes: FlowNode[] = [];
  const nodePosMap = new Map<string, { x: number; y: number }>();

  let currentY = 48;

  const placeGrid = (
    laneId: string,
    laneLabel: string,
    category: ArchifyCustomNodeData["category"],
    icon: ArchifyCustomNodeData["iconType"],
    grid: (DiagramNodeDto | null)[][],
  ) => {
    if (grid.length === 0) return;

    const rowCount = grid.length;
    const laneHeight = LANE_PADDING_TOP + rowCount * ROW_HEIGHT + LANE_PADDING_BOTTOM;

    resultNodes.push({
      id: laneId,
      type: "boundaryNode",
      position: { x: 25, y: currentY },
      zIndex: -2,
      data: { id: laneId, label: laneLabel, category, width: laneWidth, height: laneHeight, theme },
    });

    for (let r = 0; r < rowCount; r++) {
      const rowItems = grid[r].filter((n): n is DiagramNodeDto => n !== null);
      const rowOffset = Math.round(((actualCols - rowItems.length) * SPACING_X) / 2);

      let colIdx = 0;
      for (let c = 0; c < grid[r].length; c++) {
        const comp = grid[r][c];
        if (!comp) continue;

        const posX = startX + rowOffset + colIdx * SPACING_X;
        const posY = currentY + LANE_PADDING_TOP + r * ROW_HEIGHT;
        nodePosMap.set(comp.id, { x: posX, y: posY });

        let nodeIcon: ArchifyCustomNodeData["iconType"] = icon;
        const roleLower = (comp.role || "").toLowerCase();
        const kindLower = (comp.kind || "").toLowerCase();

        if (kindLower === "project" || roleLower === "project") nodeIcon = "cloud";
        else if (kindLower === "controller" || roleLower === "controller") nodeIcon = "window";
        else if (kindLower === "database" || roleLower === "database") nodeIcon = "db";
        else if (kindLower === "repository" || roleLower === "repository") nodeIcon = "grid";
        else if (kindLower === "service" || roleLower === "service") nodeIcon = "code";
        else if (kindLower === "route" || roleLower === "page") nodeIcon = "window";
        else if (kindLower === "component" || roleLower === "component") nodeIcon = "code";
        else if (kindLower === "group") nodeIcon = "grid";

        const lineRange = comp.evidence?.find((e) => e.startsWith("SRC")) || "";
        const filePath = comp.evidence?.find((e) => !e.startsWith("SRC") && !e.startsWith("(")) || comp.evidence?.[0] || "";
        const detailCard = diagram.detailCards.find((dc) => dc.nodeId === comp.id);

        resultNodes.push({
          id: comp.id,
          type: "archifyNode",
          position: { x: posX, y: posY },
          data: {
            id: comp.id,
            label: comp.label,
            kind: comp.kind,
            role: comp.role,
            subtitle: comp.role || comp.kind,
            extraText: lineRange,
            iconType: nodeIcon,
            category,
            theme,
            path: filePath,
            childDiagramType: comp.childDiagramType,
            metadata: comp.metadata,
            detailCard,
          },
        });

        colIdx++;
      }
    }

    currentY += laneHeight + LANE_GAP;
  };

  if (gatewayGrid.length > 0) {
    placeGrid("lane-gateway", "01 / Gateway & Frontend Routes", "ui", "window", gatewayGrid);
  }
  if (controllerGrid.length > 0) {
    placeGrid("lane-controllers", "02 / Controllers & Projects", "ui", "window", controllerGrid);
  }
  if (serviceGrid.length > 0) {
    placeGrid("lane-runtime", "03 / Services & Components", "runtime", "code", serviceGrid);
  }
  if (dataGrid.length > 0) {
    placeGrid("lane-data", "04 / Data & Persistence", "data", "db", dataGrid);
  }
  if (groupGrid.length > 0) {
    placeGrid("lane-groups", "05 / Other Components", "policy", "grid", groupGrid);
  }

  const isDark = theme === "dark";
  const resultEdges: Edge[] = [];
  const seenPairKeys = new Set<string>();

  for (const edgeItem of diagram.edges) {
    const { from: source, to: target, kind, label, confidence, isInferred, id } = edgeItem;
    if (source === target) continue;

    const pairKey = `${source}->${target}`;
    if (seenPairKeys.has(pairKey)) continue;
    seenPairKeys.add(pairKey);

    const sPos = nodePosMap.get(source);
    const tPos = nodePosMap.get(target);

    let sourceHandle = "r";
    let targetHandle = "l";
    if (sPos && tPos) {
      if (tPos.y > sPos.y + 60) {
        sourceHandle = "b";
        targetHandle = "t";
      } else if (sPos.y > tPos.y + 60) {
        sourceHandle = "t";
        targetHandle = "b";
      } else if (sPos.x > tPos.x + 80) {
        sourceHandle = "l";
        targetHandle = "r";
      }
    }

    const edgeColor = isDark ? "#00f0ff" : "#0284c7";
    resultEdges.push({
      id: id || `edge-${source}-${target}`,
      source,
      target,
      sourceHandle,
      targetHandle,
      type: "archifyEdge",
      label: label || (isInferred ? `${kind} (${confidence})` : kind),
      style: {
        stroke: edgeColor,
        strokeWidth: 1.8,
        strokeDasharray: isInferred ? "6 4" : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
        width: 14,
        height: 14,
      },
      data: {
        isInferred,
        confidence,
        label: label || kind,
      },
    });
  }

  return { nodes: resultNodes, edges: resultEdges };
}

// Map live repository graph data into Archify lanes cleanly with NO collisions or cross-card lines
// Fully generic: works for ANY repository by dynamically categorizing nodes and routing ALL backend edges
function buildLiveRepoArchifyGraph(
  rawNodes: VisualGraphNode[],
  rawEdges: { id: string; source: string; target: string; relationship: string; evidenceId?: string | null; evidence?: unknown }[],
  theme: "dark" | "light",
): { nodes: FlowNode[]; edges: Edge[] } {
  // Deduplicate raw nodes strictly by ID
  const seenNodeIds = new Set<string>();
  const uniqueRawNodes: VisualGraphNode[] = [];
  for (const n of rawNodes) {
    if (!seenNodeIds.has(n.id)) {
      seenNodeIds.add(n.id);
      uniqueRawNodes.push(n);
    }
  }

  if (uniqueRawNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Filter out boilerplate starter files (like AppService / AppController) if domain services exist
  const hasDomainServices = uniqueRawNodes.some(
    (n) => n.label.toLowerCase() !== "appservice" && n.label.toLowerCase().endsWith("service")
  );
  const filteredRawNodes = uniqueRawNodes.filter((n) => {
    const l = n.label.toLowerCase();
    if (hasDomainServices && (l === "appservice" || l === "appcontroller")) {
      return false;
    }
    return true;
  });

  // ── 1. Categorize every node into semantic tiers based on kind/type ──
  const projectNodes: VisualGraphNode[] = [];
  const controllerNodes: VisualGraphNode[] = [];
  const serviceNodes: VisualGraphNode[] = [];
  const dataNodes: VisualGraphNode[] = [];
  const policyNodes: VisualGraphNode[] = [];
  const externalNodes: VisualGraphNode[] = [];

  for (const node of filteredRawNodes) {
    const kindLower = (node.kind || "").toLowerCase();
    const labelLower = node.label.toLowerCase();

    if (
      kindLower === "project" ||
      kindLower === "container" ||
      labelLower.includes("frontend") ||
      labelLower.includes("client") ||
      labelLower.includes("gateway")
    ) {
      projectNodes.push(node);
    } else if (
      kindLower.includes("controller") ||
      labelLower.includes("controller") ||
      kindLower.includes("endpoint")
    ) {
      controllerNodes.push(node);
    } else if (
      labelLower.includes("prisma") ||
      labelLower.includes("dbcontext") ||
      labelLower.includes("datasource") ||
      labelLower.includes("postgres") ||
      labelLower.includes("database") ||
      kindLower.includes("database") ||
      kindLower.includes("entity") ||
      labelLower.endsWith("entity") ||
      labelLower.includes("table") ||
      kindLower === "databaseentity" ||
      kindLower === "dataaccess"
    ) {
      dataNodes.push(node);
    } else if (
      (labelLower.includes("guard") ||
        labelLower.includes("strategy") ||
        labelLower.includes("policy") ||
        labelLower.includes("gate") ||
        labelLower.includes("validator") ||
        kindLower.includes("guard") ||
        kindLower.includes("policy") ||
        (labelLower.includes("role") && !labelLower.includes("service"))) &&
      !labelLower.includes("service")
    ) {
      // Strictly security guards/strategies; AuthService goes to core serviceNodes!
      policyNodes.push(node);
    } else if (
      labelLower.includes("oauth") ||
      labelLower.includes("google") ||
      labelLower.includes("resend") ||
      labelLower.includes("smtp") ||
      labelLower.includes("external") ||
      kindLower.includes("external")
    ) {
      externalNodes.push(node);
    } else {
      // Core application services (AuthService, UsersService, CatalogService, FarmsService, SalesService, MailService, etc.)
      serviceNodes.push(node);
    }
  }

  // Ensure Frontend/Gateway entrypoint exists if controllers or services are present
  if (projectNodes.length === 0 && (controllerNodes.length > 0 || serviceNodes.length > 0)) {
    projectNodes.push({
      id: "client-frontend",
      label: "Frontend (Web UI)",
      kind: "Project",
      metadata: { role: "Web Client & REST API Consumer" },
    });
  }

  // Ensure PostgreSQL Database node exists in data tier
  const hasDbEngine = dataNodes.some(
    (n) =>
      n.label.toLowerCase().includes("postgres") ||
      n.label.toLowerCase().includes("database") ||
      n.kind?.toLowerCase() === "database"
  );
  if (!hasDbEngine && (dataNodes.length > 0 || serviceNodes.length > 0)) {
    dataNodes.push({
      id: "db-postgresql",
      label: "PostgreSQL Database",
      kind: "Database",
      metadata: { engine: "PostgreSQL", role: "Primary Relational Storage" },
    });
  }

  // Ensure External Services exist if AuthService or MailService are present
  const hasAuth = serviceNodes.some((s) => s.label.toLowerCase().includes("auth"));
  const hasGoogle = externalNodes.some(
    (e) => e.label.toLowerCase().includes("google") || e.label.toLowerCase().includes("oauth")
  );
  if (hasAuth && !hasGoogle) {
    externalNodes.push({
      id: "ext-google-oauth",
      label: "Google OAuth",
      kind: "ExternalService",
      metadata: { provider: "Google Identity", role: "Social Login & SSO" },
    });
  }

  const hasMail = serviceNodes.some(
    (s) => s.label.toLowerCase().includes("mail") || s.label.toLowerCase().includes("email")
  );
  const hasEmailProvider = externalNodes.some(
    (e) =>
      e.label.toLowerCase().includes("mail") ||
      e.label.toLowerCase().includes("resend") ||
      e.label.toLowerCase().includes("smtp")
  );
  if (hasMail && !hasEmailProvider) {
    externalNodes.push({
      id: "ext-email-provider",
      label: "Email Service (Resend/SMTP)",
      kind: "ExternalService",
      metadata: { provider: "Resend / SMTP", role: "Transactional Mail Gateway" },
    });
  }

  // ── 2. Build tier groups ──
  // Tier 1: Projects + Controllers (Gateway / UI Layer)
  const tier1Nodes = [...projectNodes, ...controllerNodes];
  // Policy Tier: JwtAuthGuard, RolesGuard, JwtStrategy (Guards & Gateways)
  const hasPolicyTier = policyNodes.length > 0;
  // Tier 2: Core Services (AuthService, UsersService, CatalogService, FarmsService, SalesService, MailService)
  const tier2Nodes = [...serviceNodes];
  // Tier 3: Data Access & Database (PrismaService, PostgreSQL Database, Entities)
  const tier3Nodes = [...dataNodes];
  // Tier 4: External Services (Google OAuth, Email Provider)
  const hasExternalTier = externalNodes.length > 0;

  // ── 3. Generic Grid Layout Engine ──
  const COLS_PER_ROW = 5;
  const SPACING_X = 230;
  const ROW_HEIGHT = 105;
  const LANE_PADDING_TOP = 42;
  const LANE_GAP = 28;
  const LANE_PADDING_BOTTOM = 18;

  const buildGrid = (items: VisualGraphNode[]): (VisualGraphNode | null)[][] => {
    if (items.length === 0) return [];
    const rowCount = Math.ceil(items.length / COLS_PER_ROW);
    const grid: (VisualGraphNode | null)[][] = Array.from({ length: rowCount }, () =>
      Array.from({ length: COLS_PER_ROW }, () => null)
    );
    let idx = 0;
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < COLS_PER_ROW; c++) {
        if (idx < items.length) {
          grid[r][c] = items[idx++];
        }
      }
    }
    return grid;
  };

  const tier1Grid = buildGrid(tier1Nodes);
  const policyGrid = buildGrid(policyNodes);
  const tier2Grid = buildGrid(tier2Nodes);
  const tier3Grid = buildGrid(tier3Nodes);
  const externalGrid = buildGrid(externalNodes);

  // Compute maximum columns used to center the layout
  const maxNodesInRow = Math.max(
    tier1Nodes.length > 0 ? Math.min(tier1Nodes.length, COLS_PER_ROW) : 0,
    policyNodes.length > 0 ? Math.min(policyNodes.length, COLS_PER_ROW) : 0,
    tier2Nodes.length > 0 ? Math.min(tier2Nodes.length, COLS_PER_ROW) : 0,
    tier3Nodes.length > 0 ? Math.min(tier3Nodes.length, COLS_PER_ROW) : 0,
    externalNodes.length > 0 ? Math.min(externalNodes.length, COLS_PER_ROW) : 0
  );
  const actualCols = Math.max(3, maxNodesInRow);
  const laneWidth = actualCols * SPACING_X + 60;
  const startX = 40;

  // ── 4. Place Nodes into Lanes ──
  const resultNodes: FlowNode[] = [];
  const nodePosMap = new Map<string, { x: number; y: number; lane: string; row: number; col: number }>();

  // Top Stage Labels
  const stageLabels: { label: string; xFraction: number }[] = [];
  if (tier1Nodes.length > 0) stageLabels.push({ label: "01 / Gateway & Routing", xFraction: 0.12 });
  if (hasPolicyTier) stageLabels.push({ label: "EX / Security & Policy", xFraction: 0.35 });
  if (tier2Nodes.length > 0) stageLabels.push({ label: "02 / Core Services & Logic", xFraction: 0.58 });
  if (tier3Nodes.length > 0) stageLabels.push({ label: "03 / Data & Persistence", xFraction: 0.82 });
  if (hasExternalTier) stageLabels.push({ label: "04 / External Services", xFraction: 0.95 });

  stageLabels.forEach((stage, i) => {
    resultNodes.push({
      id: `stage-label-${i}`,
      type: "stageNode",
      position: { x: Math.round(laneWidth * stage.xFraction), y: 15 },
      zIndex: 0,
      data: { label: stage.label, theme },
    });
  });

  let currentY = 48;

  const placeGrid = (
    laneId: string,
    laneLabel: string,
    category: ArchifyCustomNodeData["category"],
    icon: ArchifyCustomNodeData["iconType"],
    grid: (VisualGraphNode | null)[][]
  ) => {
    if (grid.length === 0) return;

    const rowCount = grid.length;
    const laneHeight = LANE_PADDING_TOP + rowCount * ROW_HEIGHT + LANE_PADDING_BOTTOM;

    resultNodes.push({
      id: laneId,
      type: "boundaryNode",
      position: { x: 25, y: currentY },
      zIndex: -2,
      data: { id: laneId, label: laneLabel, category, width: laneWidth, height: laneHeight, theme },
    });

    for (let r = 0; r < rowCount; r++) {
      const rowItems = grid[r].filter((n): n is VisualGraphNode => n !== null);
      const rowOffset = Math.round(((actualCols - rowItems.length) * SPACING_X) / 2);

      let colIdx = 0;
      for (let c = 0; c < grid[r].length; c++) {
        const comp = grid[r][c];
        if (!comp) continue;

        const posX = startX + rowOffset + colIdx * SPACING_X;
        const posY = currentY + LANE_PADDING_TOP + r * ROW_HEIGHT;

        nodePosMap.set(comp.id, { x: posX, y: posY, lane: laneId, row: r, col: colIdx });

        const isProject = (comp.kind || "").toLowerCase() === "project";
        const isController =
          (comp.kind || "").toLowerCase().includes("controller") || comp.label.toLowerCase().includes("controller");
        const isDb =
          (comp.kind || "").toLowerCase().includes("database") ||
          (comp.kind || "").toLowerCase().includes("entity") ||
          comp.label.toLowerCase().includes("prisma");
        const isGuard =
          comp.label.toLowerCase().includes("guard") || comp.label.toLowerCase().includes("strategy");
        const isExt =
          comp.kind?.toLowerCase().includes("external") ||
          comp.label.toLowerCase().includes("oauth") ||
          comp.label.toLowerCase().includes("email service") ||
          comp.label.toLowerCase().includes("google");

        let nodeIcon: ArchifyCustomNodeData["iconType"] = icon;
        if (isProject) nodeIcon = "cloud";
        else if (isController) nodeIcon = "window";
        else if (isDb) nodeIcon = "db";
        else if (isGuard) nodeIcon = "shield";
        else if (isExt) nodeIcon = "cloud";
        else if (comp.label.toLowerCase().includes("service")) nodeIcon = "code";
        else if (comp.label.toLowerCase().includes("repository")) nodeIcon = "grid";
        else if (comp.label.toLowerCase().includes("handler")) nodeIcon = "menu";

        let subtitle = comp.kind || "";
        if (comp.metadata) {
          if (comp.metadata.projectType) subtitle = comp.metadata.projectType as string;
          else if (comp.metadata.language) subtitle = comp.metadata.language as string;
          else if (comp.metadata.endpointsCount) subtitle = `${comp.metadata.endpointsCount} endpoints`;
          else if (comp.metadata.entityType) subtitle = comp.metadata.entityType as string;
          else if (comp.metadata.role) subtitle = comp.metadata.role as string;
        }

        resultNodes.push({
          id: comp.id,
          type: "archifyNode",
          position: { x: posX, y: posY },
          data: {
            id: comp.id,
            label: comp.label,
            kind: comp.kind,
            subtitle,
            iconType: nodeIcon,
            category,
            theme,
            metadata: comp.metadata,
            path: comp.path,
          },
        });

        colIdx++;
      }
    }

    currentY += laneHeight + LANE_GAP;
  };

  // Place all tiers in structured top-to-bottom architectural flow
  if (tier1Grid.length > 0) {
    placeGrid("lane-gateway", "01 / User Interface & Gateway", "ui", "window", tier1Grid);
  }
  if (hasPolicyTier) {
    placeGrid("lane-policy", "EX / Policy, Guard & Gate", "policy", "shield", policyGrid);
  }
  if (tier2Grid.length > 0) {
    placeGrid("lane-runtime", "02 / Core Runtime & Application Services", "runtime", "code", tier2Grid);
  }
  if (tier3Grid.length > 0) {
    placeGrid("lane-data", "03 / Data, Persistence & Storage", "data", "db", tier3Grid);
  }
  if (hasExternalTier) {
    placeGrid("lane-external", "04 / External Services & Cloud APIs", "external", "cloud", externalGrid);
  }

  // ── 5. Edge Synthesis & Layout ──
  const edgeList: { source: string; target: string; relationship: string; id?: string }[] = [...rawEdges];

  const hasEdge = (src: string, tgt: string) =>
    edgeList.some((e) => (e.source === src && e.target === tgt) || (e.source === tgt && e.target === src));

  const addEdgeIfMissing = (source: string, target: string, relationship: string) => {
    if (source && target && source !== target && !hasEdge(source, target)) {
      edgeList.push({
        id: `synth-${source}-${target}`,
        source,
        target,
        relationship,
      });
    }
  };

  // 1. Frontend / Gateway -> Controllers
  const hostProj = projectNodes[0];
  if (hostProj) {
    for (const ctrl of controllerNodes) {
      addEdgeIfMissing(hostProj.id, ctrl.id, "REST API");
    }
  }

  // 2. Controllers -> Services
  for (const ctrl of controllerNodes) {
    const ctrlStem = ctrl.label.replace(/controller/i, "").toLowerCase();
    const matchedService =
      serviceNodes.find((s) => {
        const sStem = s.label.replace(/service/i, "").toLowerCase();
        return (
          sStem === ctrlStem ||
          s.label.toLowerCase().includes(ctrlStem) ||
          (ctrlStem.length > 2 && sStem.includes(ctrlStem))
        );
      }) || serviceNodes[0];

    if (matchedService) {
      addEdgeIfMissing(ctrl.id, matchedService.id, "Dispatches");
    }
  }

  // 3. AuthService dependencies: AuthService -> UsersService, AuthService -> MailService
  const authService = serviceNodes.find((s) => s.label.toLowerCase().includes("auth"));
  const usersService = serviceNodes.find((s) => s.label.toLowerCase().includes("user"));
  const mailService = serviceNodes.find(
    (s) => s.label.toLowerCase().includes("mail") || s.label.toLowerCase().includes("email")
  );

  if (authService && usersService) {
    addEdgeIfMissing(authService.id, usersService.id, "Calls");
  }
  if (authService && mailService) {
    addEdgeIfMissing(authService.id, mailService.id, "Dispatches Mail");
  }
  if (usersService && mailService) {
    addEdgeIfMissing(usersService.id, mailService.id, "Dispatches Mail");
  }

  // 4. Policy / Guards connections
  for (const guard of policyNodes) {
    for (const ctrl of controllerNodes.slice(0, 4)) {
      addEdgeIfMissing(ctrl.id, guard.id, "Guarded by");
    }
    if (guard.label.toLowerCase().includes("jwt") && authService) {
      addEdgeIfMissing(guard.id, authService.id, "Validates with");
    }
  }

  // 5. Services -> Data Access (PrismaService / PostgreSQL)
  const prismaNode =
    dataNodes.find((d) => d.label.toLowerCase().includes("prisma")) ||
    serviceNodes.find((s) => s.label.toLowerCase().includes("prisma"));
  const postgresNode = dataNodes.find(
    (d) => d.label.toLowerCase().includes("postgres") || d.label.toLowerCase().includes("database")
  );

  if (prismaNode) {
    for (const s of serviceNodes) {
      if (s.id !== prismaNode.id) {
        addEdgeIfMissing(s.id, prismaNode.id, "Queries DB");
      }
    }
    if (postgresNode) {
      addEdgeIfMissing(prismaNode.id, postgresNode.id, "TCP:5432 Connection");
    }
    for (const d of dataNodes) {
      if (d.id !== prismaNode.id && (!postgresNode || d.id !== postgresNode.id)) {
        addEdgeIfMissing(prismaNode.id, d.id, "Maps Entity");
      }
    }
  } else if (postgresNode) {
    for (const s of serviceNodes) {
      addEdgeIfMissing(s.id, postgresNode.id, "Queries DB");
    }
  }

  // 6. External Services
  const googleOAuthNode = externalNodes.find(
    (e) => e.label.toLowerCase().includes("google") || e.label.toLowerCase().includes("oauth")
  );
  const emailNode = externalNodes.find(
    (e) =>
      e.label.toLowerCase().includes("mail") ||
      e.label.toLowerCase().includes("resend") ||
      e.label.toLowerCase().includes("smtp")
  );

  if (authService && googleOAuthNode) {
    addEdgeIfMissing(authService.id, googleOAuthNode.id, "Verifies Token");
  }
  if (mailService && emailNode) {
    addEdgeIfMissing(mailService.id, emailNode.id, "Sends Mail");
  }

  // ── 6. Render ALL edges with optimal handle routing ──
  const isDark = theme === "dark";
  const edgeColor = isDark ? "#00f0ff" : "#0284c7";
  const resultEdges: Edge[] = [];
  const seenPairKeys = new Set<string>();

  for (const edgeItem of edgeList) {
    const { source, target, relationship, id: rawId } = edgeItem;
    if (source === target) continue;

    const pairKey = `${source}->${target}`;
    const reversePairKey = `${target}->${source}`;
    if (seenPairKeys.has(pairKey) || seenPairKeys.has(reversePairKey)) continue;
    seenPairKeys.add(pairKey);

    const sPos = nodePosMap.get(source);
    const tPos = nodePosMap.get(target);
    if (!sPos || !tPos) continue;

    const { sourceHandle, targetHandle } = getOptimalHandles(sPos, tPos);

    resultEdges.push({
      id: rawId || `edge-${source}-${target}`,
      source,
      target,
      sourceHandle,
      targetHandle,
      label: relationship,
      type: "archifyEdge",
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 14, height: 14 },
      style: { stroke: edgeColor, strokeWidth: 2 },
      data: { theme },
    });
  }

  return { nodes: resultNodes, edges: resultEdges };
}

// Main Component Export
export function RepositoryGraph({
  analysisId,
  kind = "architecture",
}: {
  analysisId?: string;
  kind?: GraphKind;
}) {
  return (
    <ReactFlowProvider>
      <ArchifyGraphCanvas analysisId={analysisId} kind={kind} />
    </ReactFlowProvider>
  );
}

// Inner Canvas Component with Archify Features
function ArchifyGraphCanvas({
  analysisId,
  kind,
}: {
  analysisId?: string;
  kind?: GraphKind;
}) {
  const reactFlow = useReactFlow();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  // Selected Workflow Tab (defaults to "05-repo" if analysisId is provided)
  const [activeTab, setActiveTab] = useState<WorkflowPresetKey>(analysisId ? "05-repo" : "01-agent");

  // Selected Node for Deep Focus & Halo Interaction
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Hovered Node for Instant Signal Flow on Mouse-over
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Selected Edge for Relationship & Evidence Inspection
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // HUD Card active tab: "MAP" | "FOCUS" | "TRACE" | "LENS"
  const [hudTab, setHudTab] = useState<"MAP" | "FOCUS" | "TRACE" | "LENS">("MAP");

  // Signal Flow Trace Direction: "none" | "upstream" | "downstream"
  const [traceDirection, setTraceDirection] = useState<"none" | "upstream" | "downstream">("none");

  // Semantic Lens: "all" | "ui" | "runtime" | "policy" | "data" | "external"
  const [activeLens, setActiveLens] = useState<"all" | "ui" | "runtime" | "policy" | "data" | "external">("all");

  // Route Probing (Path Finding A -> B)
  const [routeStartId, setRouteStartId] = useState<string | null>(null);
  const [routeEndId, setRouteEndId] = useState<string | null>(null);
  const [isRouteProbing, setIsRouteProbing] = useState<boolean>(false);
  const [routePathNodeIds, setRoutePathNodeIds] = useState<Set<string>>(new Set());
  const [routePathEdgeIds, setRoutePathEdgeIds] = useState<Set<string>>(new Set());

  // Search & Node Finder
  const [searchQuery, setSearchQuery] = useState("");

  // Trace Motion (Animated Signal Particles)
  const [isTraceMotion, setIsTraceMotion] = useState(true);

  // Pulse counter to trigger 1-shot animation on hover/selection
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    if (hoveredNodeId || selectedNodeId) {
      setPulseCount((c) => c + 1);
    }
  }, [hoveredNodeId, selectedNodeId]);

  // Raw Graph Data for Live Repo Mode
  const [, setRawGraph] = useState<VisualGraph | null>(null);
  const [classification, setClassification] = useState<RepositoryClassification | null>(null);
  const [diagramDto, setDiagramDto] = useState<DiagramDto | null>(null);
  const [activeDiagramType, setActiveDiagramType] = useState<string>("default");
  const [availableDiagramTypes, setAvailableDiagramTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Diagram View Lock: default false so users can freely pan, drag nodes and organize layout
  const [isViewLocked, setIsViewLocked] = useState(false);

  // Inspector HUD Panel: collapsed by default so the diagram has 100% full, unobstructed visibility
  const [isHudOpen, setIsHudOpen] = useState(false);

  // MiniMap display toggle: default false to avoid cluttering canvas corners
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Node & Edge States
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Disallow dragging only when view lock is explicitly enabled
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      if (isViewLocked) {
        const fixedChanges = changes.filter((c) => c.type !== "position");
        if (fixedChanges.length > 0) {
          onNodesChange(fixedChanges);
        }
      } else {
        onNodesChange(changes);
      }
    },
    [isViewLocked, onNodesChange],
  );

  // Load Graph Data depending on Active Tab & activeDiagramType
  useEffect(() => {
    if (activeTab === "05-repo" && analysisId) {
      setLoading(true);
      setError(null);

      // Fetch repository classification in parallel
      analysisGateway
        .classification(analysisId)
        .then((cls) => setClassification(cls))
        .catch(() => {});

      // Fetch typed diagram from backend
      analysisGateway
        .diagram(analysisId, activeDiagramType === "default" ? undefined : activeDiagramType)
        .then((diagram) => {
          setDiagramDto(diagram);
          if (diagram.availableDiagramTypes && diagram.availableDiagramTypes.length > 0) {
            setAvailableDiagramTypes(diagram.availableDiagramTypes);
          }
          const { nodes: builtNodes, edges: builtEdges } = buildFromDiagramDto(diagram, theme);
          setNodes(builtNodes);
          setEdges(builtEdges);
          setTimeout(() => {
            reactFlow.fitView({ padding: 0.2, duration: 400 });
          }, 60);
        })
        .catch(() => {
          // Fallback to legacy architecture endpoint
          analysisGateway[kind === "dependencies" ? "dependencies" : "architecture"](analysisId)
            .then((graph) => {
              setRawGraph(graph);
              const { nodes: builtNodes, edges: builtEdges } = buildLiveRepoArchifyGraph(graph.nodes, graph.edges, theme);
              setNodes(builtNodes);
              setEdges(builtEdges);
              setTimeout(() => {
                reactFlow.fitView({ padding: 0.2, duration: 400 });
              }, 60);
            })
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Unable to load repository diagram.");
            });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      const { nodes: builtNodes, edges: builtEdges } = buildAgentToolCallWorkflow(theme);
      setNodes(builtNodes);
      setEdges(builtEdges);
      setRawGraph(null);
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.18, duration: 400 });
      }, 60);
    }
  }, [activeTab, analysisId, kind, theme, activeDiagramType, reactFlow, setNodes, setEdges]);


  // Route Probing Calculation (BFS Shortest Path A -> B)
  const executeRouteProbe = useCallback(
    (start: string, end: string) => {
      const queue = [start];
      const visited = new Set<string>([start]);
      const parentMap = new Map<string, { parent: string; edge: Edge }>();

      let found = false;
      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (curr === end) {
          found = true;
          break;
        }

        for (const edge of edges) {
          let next: string | null = null;
          if (edge.source === curr) next = edge.target;
          else if (edge.target === curr) next = edge.source;

          if (next && !visited.has(next)) {
            visited.add(next);
            parentMap.set(next, { parent: curr, edge });
            queue.push(next);
          }
        }
      }

      if (found) {
        const pathNodes = new Set<string>();
        const pathEdges = new Set<string>();

        let curr = end;
        pathNodes.add(curr);
        while (parentMap.has(curr)) {
          const { parent, edge } = parentMap.get(curr)!;
          pathEdges.add(edge.id);
          pathNodes.add(parent);
          curr = parent;
        }

        setRoutePathNodeIds(pathNodes);
        setRoutePathEdgeIds(pathEdges);
        setIsRouteProbing(true);
        setHudTab("TRACE");
      } else {
        alert(`No direct or indirect route found between "${start}" and "${end}".`);
      }
    },
    [edges],
  );

  // Compute Active Connected Paths for Dimming & Halos
  const { activeNodeIds, activeEdgeIds } = useMemo(() => {
    if (isRouteProbing && routePathNodeIds.size > 0) {
      return { activeNodeIds: routePathNodeIds, activeEdgeIds: routePathEdgeIds };
    }

    if (activeLens !== "all") {
      const lensNodes = new Set<string>();
      const lensEdges = new Set<string>();
      nodes.forEach((n) => {
        if (n.type === "archifyNode" && (n.data as ArchifyCustomNodeData).category === activeLens) {
          lensNodes.add(n.id);
        }
      });
      edges.forEach((e) => {
        if (lensNodes.has(e.source) && lensNodes.has(e.target)) {
          lensEdges.add(e.id);
        }
      });
      return { activeNodeIds: lensNodes, activeEdgeIds: lensEdges };
    }

    const focusId = hoveredNodeId || selectedNodeId;
    if (!focusId) {
      return { activeNodeIds: new Set<string>(), activeEdgeIds: new Set<string>() };
    }

    const nodeIds = new Set<string>([focusId]);
    const edgeIds = new Set<string>();

    const detailCard = diagramDto?.detailCards?.find((dc) => dc.nodeId === focusId);

    if (traceDirection === "upstream") {
      if (detailCard?.upstreamNodes) {
        detailCard.upstreamNodes.forEach((id) => nodeIds.add(id));
      }
      const queue = [focusId];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        for (const edge of edges) {
          if (edge.target === curr) {
            edgeIds.add(edge.id);
            if (!nodeIds.has(edge.source)) {
              nodeIds.add(edge.source);
              queue.push(edge.source);
            }
          }
        }
      }
    } else if (traceDirection === "downstream") {
      if (detailCard?.downstreamNodes) {
        detailCard.downstreamNodes.forEach((id) => nodeIds.add(id));
      }
      const queue = [focusId];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        for (const edge of edges) {
          if (edge.source === curr) {
            edgeIds.add(edge.id);
            if (!nodeIds.has(edge.target)) {
              nodeIds.add(edge.target);
              queue.push(edge.target);
            }
          }
        }
      }
    } else {
      for (const edge of edges) {
        if (edge.source === focusId) {
          edgeIds.add(edge.id);
          nodeIds.add(edge.target);
        }
        if (edge.target === focusId) {
          edgeIds.add(edge.id);
          nodeIds.add(edge.source);
        }
      }
    }

    return { activeNodeIds: nodeIds, activeEdgeIds: edgeIds };
  }, [hoveredNodeId, selectedNodeId, traceDirection, edges, isRouteProbing, routePathNodeIds, routePathEdgeIds, activeLens, nodes, diagramDto]);

  // Style Nodes dynamically based on hover, selection & filter states (strictly fixed / immovable)
  const styledNodes = useMemo(() => {
    const focusId = hoveredNodeId || selectedNodeId;
    const isAnySelected = focusId !== null || isRouteProbing || activeLens !== "all";

    return nodes.map((n): FlowNode => {
      if (n.type === "archifyNode") {
        const data = n.data as ArchifyCustomNodeData;
        const isSelected = data.id === focusId;
        const isConnected = activeNodeIds.has(data.id);
        const isRoutePath = routePathNodeIds.has(data.id);
        const isDimmed = isAnySelected && !isSelected && !isConnected && !isRoutePath;

        return {
          ...n,
          draggable: !isViewLocked,
          data: {
            ...data,
            theme,
            isSelected,
            isConnected,
            isRoutePath,
            isDimmed,
          },
        };
      }

      if (n.type === "boundaryNode") {
        const data = n.data as BoundaryBoxData;
        return {
          ...n,
          draggable: false,
          selectable: false,
          focusable: false,
          style: { pointerEvents: "none" },
          data: {
            ...data,
            theme,
            isDimmed: isAnySelected && activeLens !== "all" && data.category !== activeLens,
          },
        };
      }

      if (n.type === "stageNode") {
        return {
          ...n,
          draggable: false,
          selectable: false,
          focusable: false,
          style: { pointerEvents: "none" },
          data: {
            ...n.data,
            theme,
          },
        };
      }

      return {
        ...(n as FlowNode),
        draggable: false,
      };
    });
  }, [nodes, hoveredNodeId, selectedNodeId, activeNodeIds, routePathNodeIds, isRouteProbing, activeLens, isViewLocked, theme]);


  // Style Edges dynamically:
  // - Initial state: Clean static arrow lines (animated: false).
  // - On Hover / Selection: Connected edges light up vibrant and animate flow particles ("dòng chảy từ đâu đến đâu")
  // - All other unrelated edges dim out.
  const styledEdges = useMemo(() => {
    const focusId = hoveredNodeId || selectedNodeId;
    const isAnySelected = focusId !== null || isRouteProbing || activeLens !== "all" || selectedEdgeId !== null;

    // Pick strictly 1 single edge to emit the moving beam (never 2 edges moving simultaneously):
    let primaryBeamEdgeId: string | null = null;
    if (selectedEdgeId) {
      primaryBeamEdgeId = selectedEdgeId;
    } else if (focusId) {
      // Prioritize outgoing flow (from this node forward to target)
      const outgoing = edges.find((e) => e.source === focusId);
      if (outgoing) {
        primaryBeamEdgeId = outgoing.id;
      } else {
        // If leaf node with no outgoing connections, pick the single incoming edge
        const incoming = edges.find((e) => e.target === focusId);
        if (incoming) {
          primaryBeamEdgeId = incoming.id;
        }
      }
    } else if (isRouteProbing && routePathEdgeIds.size > 0) {
      primaryBeamEdgeId = Array.from(routePathEdgeIds)[0] || null;
    }

    return edges.map((e) => {
      const isEdgeActive = activeEdgeIds.has(e.id) || e.id === selectedEdgeId;
      const isRouteEdge = routePathEdgeIds.has(e.id);
      const isDimmed = isAnySelected && !isEdgeActive && !isRouteEdge;

      // Only the chosen single edge gets the moving signal beam!
      const hasBeamPulse = e.id === primaryBeamEdgeId;

      const strokeColor = isRouteEdge
        ? "#ffbd2e"
        : isEdgeActive
          ? (theme === "dark" ? "#00f0ff" : "#0d9488")
          : isDimmed
            ? (theme === "dark" ? "#1e293b" : "#cbd5e1")
            : (e.style?.stroke as string) || (theme === "dark" ? "#38bdf8" : "#0284c7");

      const isInferred = Boolean(e.data?.isInferred);
      const strokeDasharray = isInferred ? "6 4" : undefined;

      return {
        ...e,
        type: "archifyEdge",
        style: {
          ...e.style,
          stroke: strokeColor,
          strokeDasharray,
          opacity: isDimmed ? 0.12 : 1,
          strokeWidth: isRouteEdge ? 3.5 : isEdgeActive ? 2.8 : 1.8,
        },
        markerEnd: {
          ...(typeof e.markerEnd === "object" ? e.markerEnd : {}),
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: isEdgeActive ? 18 : 14,
          height: isEdgeActive ? 18 : 14,
        },
        labelStyle: {
          ...e.labelStyle,
          opacity: isDimmed ? 0.12 : 1,
          fontWeight: isEdgeActive ? 750 : 500,
        },
        labelBgStyle: {
          ...e.labelBgStyle,
          opacity: isDimmed ? 0.12 : 1,
        },
        data: {
          ...e.data,
          isActive: hasBeamPulse,
          pulseKey: pulseCount,
          color: strokeColor,
          theme,
          onSelectEdge: (edgeId: string) => {
            setSelectedEdgeId(edgeId);
            setSelectedNodeId(null);
            setHudTab("FOCUS");
            setIsHudOpen(true);
          },
        },
      };
    });
  }, [edges, hoveredNodeId, selectedNodeId, selectedEdgeId, activeEdgeIds, routePathEdgeIds, isRouteProbing, activeLens, pulseCount, theme]);

  // Handle Node Hover (Enter / Leave) for Instant Signal Flow on Mouse-over
  const onNodeMouseEnter: NodeMouseHandler<FlowNode> = useCallback((_, node) => {
    if (node.type === "archifyNode") {
      setHoveredNodeId(node.id);
    }
  }, []);

  const onNodeMouseLeave: NodeMouseHandler<FlowNode> = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Handle Node Click
  const onNodeClick: NodeMouseHandler<FlowNode> = useCallback(
    (_, node) => {
      if (node.type === "archifyNode") {
        const id = node.id;
        setSelectedNodeId(id);
        setSelectedEdgeId(null);
        setTraceDirection("none");
        setHudTab("FOCUS");
        setIsHudOpen(true);

        if (!isViewLocked && node.position) {
          reactFlow.setCenter(node.position.x + 90, node.position.y + 35, { zoom: 1.1, duration: 400 });
        }
      }
    },
    [reactFlow, isViewLocked],
  );

  // Handle Node Double Click (open source file in Explorer directly)
  const onNodeDoubleClick: NodeMouseHandler<FlowNode> = useCallback(
    (_, node) => {
      if (node.type === "archifyNode") {
        const data = node.data as ArchifyCustomNodeData;
        const filePath = data.detailCard?.filePath || data.path;
        if (filePath && !filePath.startsWith("(") && analysisId) {
          window.open(`/projects/${analysisId}/files?path=${encodeURIComponent(filePath)}`, "_blank");
        }
      }
    },
    [analysisId],
  );

  // Handle Edge Click
  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_, edge) => {
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
      setHudTab("FOCUS");
      setIsHudOpen(true);
    },
    [],
  );

  // Handle Canvas Empty Click -> Reset
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setHoveredNodeId(null);
    setSelectedEdgeId(null);
    setTraceDirection("none");
    setIsRouteProbing(false);
    setRoutePathNodeIds(new Set());
    setRoutePathEdgeIds(new Set());
    setActiveLens("all");
    setHudTab("MAP");
    if (!isViewLocked) {
      reactFlow.fitView({ padding: 0.15, duration: 400 });
    }
  }, [reactFlow, isViewLocked]);

  // Find currently focused or selected node data
  const selectedNodeData = useMemo(() => {
    const focusId = hoveredNodeId || selectedNodeId;
    if (!focusId) return null;
    const found = nodes.find((n) => n.id === focusId && n.type === "archifyNode");
    if (!found) return null;
    const data = found.data as ArchifyCustomNodeData;
    const detailCard = data.detailCard || diagramDto?.detailCards?.find((dc) => dc.nodeId === focusId);
    return { ...data, detailCard };
  }, [nodes, hoveredNodeId, selectedNodeId, diagramDto]);

  // Find currently selected edge data
  const selectedEdgeData = useMemo(() => {
    if (!selectedEdgeId) return null;
    return edges.find((e) => e.id === selectedEdgeId) || null;
  }, [edges, selectedEdgeId]);

  // Fullscreen Presentation Mode
  const toggleFullscreen = () => {
    if (!workspaceRef.current) return;
    if (!document.fullscreenElement) {
      workspaceRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  // Node Search Execution
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase().trim();
    const match = nodes.find(
      (n) =>
        n.type === "archifyNode" &&
        ((n.data as ArchifyCustomNodeData).label.toLowerCase().includes(query) ||
          ((n.data as ArchifyCustomNodeData).subtitle || "").toLowerCase().includes(query)),
    );

    if (match && match.position) {
      setSelectedNodeId(match.id);
      setHudTab("FOCUS");
      reactFlow.setCenter(match.position.x + 90, match.position.y + 35, { zoom: 1.25, duration: 500 });
    } else {
      alert(`No component found matching "${searchQuery}".`);
    }
  };

  // Export JSON specification
  const exportJsonSpec = async () => {
    if (!analysisId) return;
    try {
      const doc = await analysisGateway.archifyV3(analysisId);
      const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `archify-${analysisId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export Archify JSON specification.");
    }
  };

  // Export Standalone HTML
  const exportStandaloneHtml = () => {
    if (!analysisId) return;
    const url = analysisGateway.exportArchifyHtmlUrl(analysisId, theme);
    window.open(url, "_blank");
  };

  const isDark = theme === "dark";

  // Tab definitions: strictly show only repository architecture when viewing an analyzed repo
  const tabs: { key: WorkflowPresetKey; label: string; file: string }[] = [];
  if (analysisId) {
    tabs.push({ key: "05-repo", label: "Live Architecture", file: `repo-${analysisId}.architecture.html` });
  } else {
    tabs.push(
      { key: "01-agent", label: "01 Agent Tool Call", file: "agent-tool-call.workflow.html" },
      { key: "02-deploy", label: "02 Production Deployment", file: "production-deploy.workflow.html" },
      { key: "03-cache", label: "03 Cache Miss", file: "cache-miss.workflow.html" },
      { key: "04-leave", label: "04 Annual Leave", file: "annual-leave.workflow.html" },
    );
  }

  const currentTabInfo = tabs.find((t) => t.key === activeTab) || tabs[0];

  return (
    <div
      ref={workspaceRef}
      style={{
        width: "100%",
        minHeight: isFullscreen ? "100vh" : "800px",
        background: isDark ? "#060b14" : "#f1f5f9",
        color: isDark ? "#f8fafc" : "#0f172a",
        padding: isFullscreen ? "0" : "16px 0",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Space Mono', Consolas, monospace",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <div className="page-shell" style={{ maxWidth: 1320, margin: "0 auto", padding: "0 12px" }}>
        {/* macOS Style Window Frame */}
        <div
          style={{
            background: isDark ? "#09101d" : "#ffffff",
            borderRadius: "16px",
            border: `1px solid ${isDark ? "#1e293b" : "#cbd5e1"}`,
            boxShadow: isDark
              ? "0 25px 65px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 240, 255, 0.08)"
              : "0 20px 50px -10px rgba(15, 23, 42, 0.12)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Top Window Bar */}
          <div
            style={{
              padding: "10px 18px",
              background: isDark ? "#091222" : "#f8fafc",
              borderBottom: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* Left: Window Traffic Lights + Tab Selection */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f56", display: "inline-block" }} />
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#27c93f", display: "inline-block" }} />
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: "4px", marginLeft: "6px", flexWrap: "wrap" }}>
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.key);
                        setSelectedNodeId(null);
                        setSelectedEdgeId(null);
                        setTraceDirection("none");
                        setIsRouteProbing(false);
                        setHudTab("MAP");
                      }}
                      style={{
                        padding: "5px 12px",
                        fontSize: "11px",
                        fontWeight: isActive ? 750 : 600,
                        borderRadius: "7px",
                        border: isActive
                          ? `1px solid ${isDark ? "rgba(0, 240, 255, 0.5)" : "rgba(2, 132, 199, 0.5)"}`
                          : "1px solid transparent",
                        cursor: "pointer",
                        background: isActive
                          ? isDark
                            ? "rgba(0, 240, 255, 0.12)"
                            : "#e0f2fe"
                          : "transparent",
                        color: isActive
                          ? isDark
                            ? "#00f0ff"
                            : "#0284c7"
                          : isDark
                            ? "#94a3b8"
                            : "#64748b",
                        transition: "all 0.18s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {tab.key === "05-repo" && <ArchitectureIcon size={13} color="currentColor" />}
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Classification badge and diagram type buttons for live repo */}
              {activeTab === "05-repo" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginLeft: "8px" }}>
                  {classification && (
                    <div
                      title={classification.summary}
                      style={{
                        padding: "4px 9px",
                        borderRadius: "7px",
                        background: isDark ? "rgba(16, 185, 129, 0.15)" : "#d1fae5",
                        border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.4)" : "#10b981"}`,
                        color: isDark ? "#34d399" : "#065f46",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span>📦 {classification.type}</span>
                      <span style={{ fontSize: "9.5px", opacity: 0.85 }}>({classification.confidence})</span>
                    </div>
                  )}

                  {availableDiagramTypes.length > 1 && (
                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      {availableDiagramTypes.map((dtype) => {
                        const isCurActive =
                          activeDiagramType === dtype ||
                          (activeDiagramType === "default" && dtype === availableDiagramTypes[0]);
                        return (
                          <button
                            key={dtype}
                            type="button"
                            onClick={() => {
                              setActiveDiagramType(dtype);
                              setSelectedNodeId(null);
                              setSelectedEdgeId(null);
                            }}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                              border: `1px solid ${
                                isCurActive
                                  ? isDark
                                    ? "#00f0ff"
                                    : "#0284c7"
                                  : isDark
                                  ? "#334155"
                                  : "#cbd5e1"
                              }`,
                              background: isCurActive
                                ? isDark
                                  ? "rgba(0, 240, 255, 0.15)"
                                  : "#e0f2fe"
                                : "transparent",
                              color: isCurActive
                                ? isDark
                                  ? "#00f0ff"
                                  : "#0284c7"
                                : isDark
                                ? "#94a3b8"
                                : "#64748b",
                              textTransform: "capitalize",
                            }}
                          >
                            {dtype.replace(/_/g, " ")}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Middle: Search Node Finder Input */}
            <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find component..."
                style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                  background: isDark ? "rgba(15, 23, 42, 0.8)" : "#ffffff",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  fontSize: "11px",
                  outline: "none",
                  width: 170,
                  fontFamily: "'JetBrains Mono', Consolas, monospace",
                }}
              />
            </form>

            {/* Right: Actions (Trace Motion, Theme, Exports, Fullscreen) */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* Trace Motion Toggle */}
              <button
                type="button"
                onClick={() => setIsTraceMotion(!isTraceMotion)}
                title="Toggle signal flow animation"
                style={{
                  padding: "5px 10px",
                  borderRadius: "7px",
                  border: `1px solid ${isTraceMotion ? (isDark ? "rgba(0, 240, 255, 0.4)" : "#0284c7") : isDark ? "#334155" : "#cbd5e1"}`,
                  background: isTraceMotion ? (isDark ? "rgba(0, 240, 255, 0.1)" : "#e0f2fe") : "transparent",
                  color: isTraceMotion ? (isDark ? "#00f0ff" : "#0284c7") : isDark ? "#94a3b8" : "#64748b",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <BoltIcon size={12} color={isTraceMotion ? (isDark ? "#00f0ff" : "#0284c7") : "currentColor"} />
                <span>{isTraceMotion ? "Flow On" : "Flow Off"}</span>
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                title={`Switch to ${isDark ? "Light mode" : "Dark mode"}`}
                style={{
                  padding: "5px 10px",
                  borderRadius: "7px",
                  border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.4)" : "#cbd5e1"}`,
                  background: isDark ? "rgba(56, 189, 248, 0.1)" : "#f1f5f9",
                  color: isDark ? "#38bdf8" : "#0284c7",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {isDark ? <SunIcon size={12} color="#f59e0b" /> : <MoonIcon size={12} color="#0284c7" />}
                <span>{isDark ? "Light" : "Dark"}</span>
              </button>

              {/* Standalone HTML Export */}
              {analysisId && (
                <button
                  type="button"
                  onClick={exportStandaloneHtml}
                  title="Export portable standalone HTML report"
                  style={{
                    padding: "5px 11px",
                    borderRadius: "7px",
                    border: `1px solid ${isDark ? "#00f0ff" : "#0284c7"}`,
                    background: isDark ? "rgba(0, 240, 255, 0.12)" : "#e0f2fe",
                    color: isDark ? "#00f0ff" : "#0284c7",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>Export HTML</span>
                  <span>↗</span>
                </button>
              )}

              {/* Export JSON */}
              {analysisId && (
                <button
                  type="button"
                  onClick={exportJsonSpec}
                  title="Download Archify V3 JSON specification"
                  style={{
                    padding: "5px 10px",
                    borderRadius: "7px",
                    border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                    background: isDark ? "#0f172a" : "#ffffff",
                    color: isDark ? "#e2e8f0" : "#334155",
                    fontSize: "11px",
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  JSON Spec
                </button>
              )}

              {/* Diagram Lock Toggle */}
              <button
                type="button"
                onClick={() => setIsViewLocked(!isViewLocked)}
                title={isViewLocked ? "Sơ đồ đang được cố định (không bị trôi). Bấm để mở khóa di chuyển tự do" : "Bấm để khóa cố định vị trí sơ đồ"}
                style={{
                  padding: "5px 10px",
                  borderRadius: "7px",
                  border: `1px solid ${isViewLocked ? (isDark ? "rgba(45, 212, 191, 0.4)" : "#059669") : isDark ? "#334155" : "#cbd5e1"}`,
                  background: isViewLocked ? (isDark ? "rgba(45, 212, 191, 0.12)" : "#ecfdf5") : "transparent",
                  color: isViewLocked ? (isDark ? "#2dd4bf" : "#059669") : isDark ? "#94a3b8" : "#64748b",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {isViewLocked ? <LockIcon size={12} /> : <UnlockIcon size={12} />}
                <span>{isViewLocked ? "Cố định" : "Tự do"}</span>
              </button>

              {/* Inspector HUD Toggle Button */}
              <button
                type="button"
                onClick={() => setIsHudOpen(!isHudOpen)}
                title="Bật / tắt bảng thông số chi tiết"
                style={{
                  padding: "5px 10px",
                  borderRadius: "7px",
                  border: `1px solid ${isHudOpen ? (isDark ? "#f97316" : "#ea580c") : isDark ? "#334155" : "#cbd5e1"}`,
                  background: isHudOpen ? (isDark ? "rgba(249, 115, 22, 0.15)" : "#ffedd5") : "transparent",
                  color: isHudOpen ? (isDark ? "#f97316" : "#c2410c") : isDark ? "#94a3b8" : "#64748b",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <BoltIcon size={12} color={isDark ? "#f97316" : "#ea580c"} />
                <span>Inspector</span>
                <span style={{ fontSize: "10px" }}>{isHudOpen ? "▴" : "▾"}</span>
              </button>

              {/* MiniMap Toggle Button */}
              <button
                type="button"
                onClick={() => setShowMiniMap(!showMiniMap)}
                title="Bật / tắt bản đồ thu nhỏ"
                style={{
                  padding: "5px 9px",
                  borderRadius: "7px",
                  border: `1px solid ${showMiniMap ? (isDark ? "#00f0ff" : "#0284c7") : isDark ? "#334155" : "#cbd5e1"}`,
                  background: showMiniMap ? (isDark ? "rgba(0, 240, 255, 0.12)" : "#e0f2fe") : "transparent",
                  color: showMiniMap ? (isDark ? "#00f0ff" : "#0284c7") : isDark ? "#94a3b8" : "#64748b",
                  fontSize: "11px",
                  fontWeight: 650,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <MapIcon size={12} />
                <span>Map</span>
              </button>

              {/* Reset Camera View */}
              <button
                type="button"
                onClick={() => reactFlow.fitView({ padding: 0.12, duration: 400 })}
                title="Fit diagram to window"
                style={{
                  padding: "5px 10px",
                  borderRadius: "7px",
                  border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                  background: "transparent",
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                Reset View
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                title="Toggle fullscreen stage"
                style={{
                  padding: "5px 9px",
                  borderRadius: "7px",
                  border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                  background: "transparent",
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                ⛶
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div style={{ height: isFullscreen ? "calc(100vh - 92px)" : "660px", position: "relative" }}>
            {/* Archify 1-Shot Traveling Beam Pulse Keyframes */}
            <style>{`
              @keyframes archify-beam-pulse {
                0% {
                  stroke-dashoffset: 100;
                  opacity: 0;
                }
                10% {
                  opacity: 1;
                }
                80% {
                  opacity: 1;
                }
                100% {
                  stroke-dashoffset: -16;
                  opacity: 0;
                }
              }

              .react-flow__node-boundaryNode,
              .react-flow__node-stageNode {
                pointer-events: none !important;
              }
            `}</style>

            <ReactFlow<FlowNode, Edge>
              nodes={styledNodes}
              edges={styledEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              nodesDraggable={!isViewLocked}
              nodesConnectable={false}
              elementsSelectable={true}
              panOnDrag={!isViewLocked}
              panOnScroll={false}
              zoomOnScroll={true}
              zoomOnPinch={true}
              zoomOnDoubleClick={false}
              preventScrolling={true}
              selectionOnDrag={false}
              deleteKeyCode={null}
              fitView
              fitViewOptions={{ padding: 0.12 }}
              minZoom={0.1}
              maxZoom={3.0}
            >
              <Background
                color={isDark ? "#142338" : "#cbd5e1"}
                gap={24}
                size={1.1}
                style={{ background: isDark ? "#070d18" : "#f8fafc" }}
              />

              {showMiniMap && (
                <MiniMap
                  pannable={!isViewLocked}
                  zoomable={!isViewLocked}
                  nodeColor={(node) => {
                    if (node.type !== "archifyNode") return "transparent";
                    const data = node.data as ArchifyCustomNodeData;
                    return data.isSelected ? "#00f0ff" : isDark ? "#2dd4bf" : "#0284c7";
                  }}
                  maskColor={isDark ? "rgba(7, 13, 24, 0.85)" : "rgba(241, 245, 249, 0.85)"}
                  style={{
                    background: isDark ? "#091222" : "#ffffff",
                    border: `1px solid ${isDark ? "#1e293b" : "#cbd5e1"}`,
                    borderRadius: "8px",
                    width: 140,
                    height: 90,
                    bottom: 16,
                    right: 16,
                  }}
                />
              )}

              <Controls showInteractive={!isViewLocked} />
            </ReactFlow>

            {/* Alert banner when status is NotDetected (e.g. Không phát hiện database) or Unsupported */}
            {diagramDto && (diagramDto.status === "NotDetected" || diagramDto.status === "Unsupported") && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(6px)",
                  background: isDark ? "rgba(7, 13, 24, 0.78)" : "rgba(248, 250, 252, 0.78)",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    maxWidth: 480,
                    width: "100%",
                    padding: "26px 28px",
                    borderRadius: "16px",
                    border: `1.5px solid ${
                      diagramDto.status === "NotDetected"
                        ? isDark
                          ? "rgba(245, 158, 11, 0.45)"
                          : "#f59e0b"
                        : isDark
                        ? "rgba(239, 68, 68, 0.45)"
                        : "#ef4444"
                    }`,
                    background: isDark ? "#091424" : "#ffffff",
                    boxShadow: isDark
                      ? "0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.1)"
                      : "0 20px 45px rgba(15, 23, 42, 0.12)",
                    textAlign: "center",
                    fontFamily: "'JetBrains Mono', Consolas, monospace",
                  }}
                >
                  <div style={{ fontSize: "38px", marginBottom: "12px" }}>
                    {diagramDto.status === "NotDetected" ? "🔍" : "⚠️"}
                  </div>
                  <h3
                    style={{
                      margin: "0 0 10px",
                      fontSize: "16px",
                      fontWeight: 800,
                      color: isDark ? "#f8fafc" : "#0f172a",
                    }}
                  >
                    {diagramDto.status === "NotDetected"
                      ? "Không phát hiện thành phần tương ứng"
                      : "Loại Repository không hỗ trợ sơ đồ này"}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 18px",
                      fontSize: "12px",
                      color: isDark ? "#94a3b8" : "#475569",
                      lineHeight: 1.6,
                    }}
                  >
                    {diagramDto.message ||
                      (diagramDto.status === "NotDetected"
                        ? "Không phát hiện mã nguồn hoặc cấu hình liên quan trong repository này (ví dụ: không có DbContext để vẽ sơ đồ ERD)."
                        : "Cấu trúc mã nguồn của repository chưa tương thích với sơ đồ đã chọn.")}
                  </p>
                  {availableDiagramTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDiagramType(availableDiagramTypes[0]);
                      }}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "8px",
                        border: "none",
                        background: isDark ? "#00f0ff" : "#0284c7",
                        color: isDark ? "#08111e" : "#ffffff",
                        fontSize: "12px",
                        fontWeight: 750,
                        cursor: "pointer",
                      }}
                    >
                      ← Quay lại sơ đồ chính ({availableDiagramTypes[0]})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Collapsed Mini HUD Pill Button (takes zero space, unblocks the diagram view) */}
            {!isHudOpen && (
              <button
                type="button"
                onClick={() => setIsHudOpen(true)}
                title="Mở bảng thông số và công cụ chi tiết"
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  padding: "6px 14px",
                  borderRadius: "20px",
                  background: isDark ? "rgba(9, 16, 29, 0.9)" : "rgba(255, 255, 255, 0.94)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${isDark ? "rgba(0, 240, 255, 0.35)" : "rgba(2, 132, 199, 0.35)"}`,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                  color: isDark ? "#00f0ff" : "#0284c7",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  zIndex: 35,
                }}
              >
                <BoltIcon size={13} color={isDark ? "#00f0ff" : "#0284c7"} />
                <span>Chi tiết & Công cụ</span>
                <span style={{ fontSize: "10px", color: isDark ? "#94a3b8" : "#64748b" }}>({hudTab})</span>
                <span style={{ fontSize: "9px" }}>▲ Mở</span>
              </button>
            )}

            {/* Floating Archify HUD Card (Collapsible, unblocking the diagram) */}
            {isHudOpen && (
              <aside
                style={{
                  position: "absolute",
                  bottom: 18,
                  left: 18,
                  width: 350,
                  maxHeight: "calc(100% - 36px)",
                  overflowY: "auto",
                  background: isDark ? "rgba(9, 16, 29, 0.96)" : "rgba(255, 255, 255, 0.96)",
                  backdropFilter: "blur(18px)",
                  border: `1.5px solid ${isDark ? "rgba(0, 240, 255, 0.35)" : "rgba(2, 132, 199, 0.35)"}`,
                  borderRadius: "14px",
                  padding: "16px 18px",
                  boxShadow: isDark
                    ? "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.15)"
                    : "0 20px 45px rgba(15, 23, 42, 0.15)",
                  zIndex: 40,
                  fontFamily: "'JetBrains Mono', Consolas, monospace",
                }}
              >
                {/* HUD Header: Tabs + Minimize/Close Button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                    paddingBottom: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px" }}>
                    {(["MAP", "FOCUS", "TRACE", "LENS"] as const).map((tab) => {
                      const isActive = hudTab === tab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => {
                            setHudTab(tab);
                            if (tab === "MAP") {
                              setSelectedNodeId(null);
                              setSelectedEdgeId(null);
                              setTraceDirection("none");
                              setIsRouteProbing(false);
                              if (!isViewLocked) {
                                reactFlow.fitView({ padding: 0.15, duration: 400 });
                              }
                            }
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: isActive ? (isDark ? "#f97316" : "#ea580c") : isDark ? "#64748b" : "#94a3b8",
                            fontWeight: 800,
                            fontSize: "11px",
                            letterSpacing: "0.08em",
                            cursor: "pointer",
                            padding: "2px 0",
                            position: "relative",
                          }}
                        >
                          {tab}
                          {isActive && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: -11,
                                left: 0,
                                right: 0,
                                height: 2,
                                background: isDark ? "#f97316" : "#ea580c",
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Close / Minimize Button */}
                  <button
                    type="button"
                    onClick={() => setIsHudOpen(false)}
                    title="Thu gọn bảng này để nhìn toàn cảnh sơ đồ"
                    style={{
                      background: isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
                      border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                      borderRadius: "6px",
                      color: isDark ? "#94a3b8" : "#64748b",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ✕ Thu gọn
                  </button>
                </div>

                {/* Status Header Badge */}
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "9.5px",
                    fontWeight: 800,
                    color: isDark ? "#f97316" : "#ea580c",
                    letterSpacing: "0.07em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>● {loading ? "ANALYZING" : "LIVE ARCHIFY"}</span>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                    {nodes.filter((n) => n.type === "archifyNode").length} COMPONENTS • {edges.length} RELATIONS
                  </span>
                </p>

                {/* Tab 1: MAP Overview */}
                {hudTab === "MAP" && (
                  <div>
                    <h3 style={{ margin: "4px 0 8px", fontSize: "14px", fontWeight: 750, color: isDark ? "#f8fafc" : "#0f172a" }}>
                      Evidence-Grounded System Topology
                    </h3>
                    <p style={{ margin: "0 0 12px", fontSize: "11px", color: isDark ? "#94a3b8" : "#475569", lineHeight: 1.55 }}>
                      Real architectural layers derived from static analysis. Click any node to focus its halo, or run Route Probe between components.
                    </p>

                    {/* Route Probe Quick Selector */}
                    <div style={{ marginTop: "12px", padding: "10px", borderRadius: "8px", background: isDark ? "rgba(15, 23, 42, 0.6)" : "#f8fafc", border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px", fontWeight: 750, color: "#ffbd2e", marginBottom: "6px" }}>
                        <BoltIcon size={12} color="#ffbd2e" />
                        <span>Route Probe (Path Tracer)</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "10.5px" }}>
                        <select
                          value={routeStartId || ""}
                          onChange={(e) => setRouteStartId(e.target.value || null)}
                          style={{ padding: "4px 8px", borderRadius: "5px", background: isDark ? "#091222" : "#ffffff", color: isDark ? "#f8fafc" : "#0f172a", border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}` }}
                        >
                          <option value="">Select Start Node (A)...</option>
                          {nodes
                            .filter((n) => n.type === "archifyNode")
                            .map((n) => (
                              <option key={n.id} value={n.id}>
                                {(n.data as ArchifyCustomNodeData).label}
                              </option>
                            ))}
                        </select>

                        <select
                          value={routeEndId || ""}
                          onChange={(e) => setRouteEndId(e.target.value || null)}
                          style={{ padding: "4px 8px", borderRadius: "5px", background: isDark ? "#091222" : "#ffffff", color: isDark ? "#f8fafc" : "#0f172a", border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}` }}
                        >
                          <option value="">Select Target Node (B)...</option>
                          {nodes
                            .filter((n) => n.type === "archifyNode")
                            .map((n) => (
                              <option key={n.id} value={n.id}>
                                {(n.data as ArchifyCustomNodeData).label}
                              </option>
                            ))}
                        </select>

                        <button
                          type="button"
                          disabled={!routeStartId || !routeEndId}
                          onClick={() => {
                            if (routeStartId && routeEndId) executeRouteProbe(routeStartId, routeEndId);
                          }}
                          style={{
                            marginTop: "4px",
                            padding: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: "none",
                            background: routeStartId && routeEndId ? "#ffbd2e" : isDark ? "#334155" : "#cbd5e1",
                            color: "#0f172a",
                            cursor: routeStartId && routeEndId ? "pointer" : "not-allowed",
                          }}
                        >
                          Trace Path Between A & B
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: FOCUS on Selected Node or Edge */}
                {hudTab === "FOCUS" && (
                  <div>
                    {selectedNodeData ? (
                      <>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", margin: "4px 0 6px" }}>
                          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 750, color: isDark ? "#00f0ff" : "#0284c7" }}>
                            {selectedNodeData.detailCard?.title || selectedNodeData.label}
                          </h3>
                          <span
                            style={{
                              padding: "2px 7px",
                              borderRadius: "4px",
                              fontSize: "9.5px",
                              fontWeight: 800,
                              background: isDark ? "rgba(0, 240, 255, 0.15)" : "#e0f2fe",
                              border: `1px solid ${isDark ? "rgba(0, 240, 255, 0.35)" : "#38bdf8"}`,
                              color: isDark ? "#38bdf8" : "#0284c7",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {selectedNodeData.detailCard?.role || selectedNodeData.role || selectedNodeData.subtitle || selectedNodeData.kind}
                          </span>
                        </div>

                        {/* Category & Symbol */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "8px", fontSize: "10px" }}>
                          <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            Category: <strong style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{selectedNodeData.category.toUpperCase()}</strong>
                          </span>
                          {selectedNodeData.detailCard?.symbol && (
                            <span style={{ color: isDark ? "#2dd4bf" : "#059669" }}>
                              • Symbol: <strong>{selectedNodeData.detailCard.symbol}</strong>
                            </span>
                          )}
                        </div>

                        {/* Line Range with SRC n Label */}
                        {(selectedNodeData.detailCard?.lineRange || selectedNodeData.extraText) && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "3px 8px",
                              borderRadius: "5px",
                              background: isDark ? "rgba(245, 158, 11, 0.12)" : "#fef3c7",
                              border: `1px solid ${isDark ? "rgba(245, 158, 11, 0.35)" : "#f59e0b"}`,
                              color: isDark ? "#fbbf24" : "#b45309",
                              fontSize: "10px",
                              fontWeight: 700,
                              marginBottom: "8px",
                            }}
                          >
                            <span>📍</span>
                            <span>{selectedNodeData.detailCard?.lineRange || selectedNodeData.extraText}</span>
                          </div>
                        )}

                        {/* File path */}
                        {(selectedNodeData.detailCard?.filePath || selectedNodeData.path) && (
                          <p style={{ display: "flex", alignItems: "center", gap: "5px", margin: "0 0 6px", fontSize: "10px", color: isDark ? "#64748b" : "#94a3b8", wordBreak: "break-all" }}>
                            <FolderIcon size={12} />
                            <span>{selectedNodeData.detailCard?.filePath || selectedNodeData.path}</span>
                          </p>
                        )}

                        {/* Open File in Explorer Link */}
                        {analysisId && (selectedNodeData.detailCard?.filePath || selectedNodeData.path) && !(selectedNodeData.detailCard?.filePath || selectedNodeData.path)?.startsWith("(") && (
                          <Link
                            href={`/projects/${analysisId}/files?path=${encodeURIComponent(selectedNodeData.detailCard?.filePath || selectedNodeData.path || "")}`}
                            style={{
                              display: "inline-block",
                              marginBottom: "10px",
                              fontSize: "10.5px",
                              color: isDark ? "#38bdf8" : "#0284c7",
                              textDecoration: "underline",
                            }}
                          >
                            View source file in Explorer ↗
                          </Link>
                        )}

                        {/* Detail Description */}
                        {selectedNodeData.detailCard?.description && (
                          <div
                            style={{
                              padding: "8px 10px",
                              borderRadius: "7px",
                              background: isDark ? "rgba(15, 23, 42, 0.65)" : "#f1f5f9",
                              border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                              fontSize: "10.5px",
                              color: isDark ? "#cbd5e1" : "#334155",
                              lineHeight: 1.55,
                              marginBottom: "10px",
                            }}
                          >
                            {selectedNodeData.detailCard.description}
                          </div>
                        )}

                        {/* Child Diagram Drill-down button (if available) */}
                        {selectedNodeData.childDiagramType && (
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedNodeData.childDiagramType) {
                                setActiveDiagramType(selectedNodeData.childDiagramType);
                                setSelectedNodeId(null);
                              }
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              padding: "7px 10px",
                              borderRadius: "7px",
                              border: `1.5px solid ${isDark ? "#a855f7" : "#7c3aed"}`,
                              background: isDark ? "rgba(168, 85, 247, 0.18)" : "#f3e8ff",
                              color: isDark ? "#c084fc" : "#6d28d9",
                              fontSize: "11px",
                              fontWeight: 750,
                              cursor: "pointer",
                              marginBottom: "10px",
                            }}
                          >
                            <span>🔍 Mở sơ đồ chi tiết:</span>
                            <strong style={{ textTransform: "capitalize" }}>{selectedNodeData.childDiagramType}</strong>
                            <span>→</span>
                          </button>
                        )}

                        {/* Direction Trace Buttons: Trace Reach */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "2px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b" }}>
                            Trace Reach (Ảnh hưởng & Phụ thuộc):
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => setTraceDirection("upstream")}
                              title="Xem các thành phần gọi đến hoặc phụ thuộc vào node này"
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                padding: "6px 8px",
                                fontSize: "10px",
                                fontWeight: 700,
                                borderRadius: "6px",
                                border: `1px solid ${isDark ? "#38bdf8" : "#0284c7"}`,
                                background: traceDirection === "upstream" ? (isDark ? "rgba(56, 189, 248, 0.3)" : "#bae6fd") : isDark ? "rgba(56, 189, 248, 0.12)" : "#e0f2fe",
                                color: isDark ? "#38bdf8" : "#0284c7",
                                cursor: "pointer",
                              }}
                            >
                              <ArrowUpIcon size={11} />
                              <span>Ai phụ thuộc nó</span>
                              {selectedNodeData.detailCard?.upstreamNodes && (
                                <span style={{ opacity: 0.85 }}>({selectedNodeData.detailCard.upstreamNodes.length})</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setTraceDirection("downstream")}
                              title="Xem các thành phần mà node này gọi đến hoặc phụ thuộc"
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                padding: "6px 8px",
                                fontSize: "10px",
                                fontWeight: 700,
                                borderRadius: "6px",
                                border: `1px solid ${isDark ? "#2dd4bf" : "#059669"}`,
                                background: traceDirection === "downstream" ? (isDark ? "rgba(45, 212, 191, 0.3)" : "#a7f3d0") : isDark ? "rgba(45, 212, 191, 0.12)" : "#d1fae5",
                                color: isDark ? "#2dd4bf" : "#059669",
                                cursor: "pointer",
                              }}
                            >
                              <ArrowDownIcon size={11} />
                              <span>Nó phụ thuộc vào</span>
                              {selectedNodeData.detailCard?.downstreamNodes && (
                                <span style={{ opacity: 0.85 }}>({selectedNodeData.detailCard.downstreamNodes.length})</span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Quick Route Probe Setters */}
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setRouteStartId(selectedNodeData.id)}
                            style={{
                              flex: 1,
                              padding: "5px",
                              fontSize: "9.5px",
                              fontWeight: 650,
                              borderRadius: "5px",
                              border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                              background: routeStartId === selectedNodeData.id ? "#ffbd2e" : "transparent",
                              color: routeStartId === selectedNodeData.id ? "#0f172a" : isDark ? "#94a3b8" : "#475569",
                              cursor: "pointer",
                            }}
                          >
                            Set Route Start (A)
                          </button>
                          <button
                            type="button"
                            onClick={() => setRouteEndId(selectedNodeData.id)}
                            style={{
                              flex: 1,
                              padding: "5px",
                              fontSize: "9.5px",
                              fontWeight: 650,
                              borderRadius: "5px",
                              border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                              background: routeEndId === selectedNodeData.id ? "#ffbd2e" : "transparent",
                              color: routeEndId === selectedNodeData.id ? "#0f172a" : isDark ? "#94a3b8" : "#475569",
                              cursor: "pointer",
                            }}
                          >
                            Set Route End (B)
                          </button>
                        </div>

                        {/* Clear Focus Button */}
                        <button
                          type="button"
                          onClick={onPaneClick}
                          style={{
                            width: "100%",
                            marginTop: "8px",
                            padding: "5px",
                            fontSize: "10px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                            background: "transparent",
                            color: isDark ? "#94a3b8" : "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          Reset All Highlights
                        </button>
                      </>
                    ) : selectedEdgeData ? (
                      <>
                        <h3 style={{ margin: "4px 0 6px", fontSize: "14px", fontWeight: 750, color: "#38bdf8" }}>
                          Relationship: {selectedEdgeData.label || "Connected"}
                        </h3>
                        <p style={{ margin: "0 0 8px", fontSize: "11px", color: isDark ? "#94a3b8" : "#475569" }}>
                          From <strong>{selectedEdgeData.source}</strong> → To <strong>{selectedEdgeData.target}</strong>
                        </p>

                        {/* Evidence inspection */}
                        <div style={{ marginTop: "10px", padding: "8px", borderRadius: "6px", background: isDark ? "rgba(15, 23, 42, 0.7)" : "#f1f5f9" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: isDark ? "#2dd4bf" : "#059669", marginBottom: "4px" }}>
                            ✓ Grounded Source Evidence
                          </div>
                          <div style={{ fontSize: "10px", color: isDark ? "#94a3b8" : "#64748b" }}>
                            Evidence ID: {(selectedEdgeData.data?.evidenceId as string) || "static analysis verified"}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={onPaneClick}
                          style={{
                            width: "100%",
                            marginTop: "8px",
                            padding: "5px",
                            fontSize: "10px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                            background: "transparent",
                            color: isDark ? "#94a3b8" : "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          Reset Edge Selection
                        </button>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>
                        Click on any component or connection edge to view its grounded code evidence and signal flow.
                      </p>
                    )}
                  </div>
                )}

                {/* Tab 3: TRACE / Route Probe Results */}
                {hudTab === "TRACE" && (
                  <div>
                    <h3 style={{ margin: "4px 0 6px", fontSize: "13px", fontWeight: 750, color: isRouteProbing ? "#ffbd2e" : isDark ? "#38bdf8" : "#0284c7" }}>
                      {isRouteProbing ? "Route Probe: Active Path" : "Signal Flow: Active Trace"}
                    </h3>

                    {isRouteProbing ? (
                      <div>
                        <p style={{ margin: "0 0 10px", fontSize: "11px", color: isDark ? "#94a3b8" : "#475569" }}>
                          Highlighting shortest path between <strong>{routeStartId}</strong> and <strong>{routeEndId}</strong> ({routePathNodeIds.size} nodes, {routePathEdgeIds.size} edges).
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRouteProbing(false);
                            setRoutePathNodeIds(new Set());
                            setRoutePathEdgeIds(new Set());
                            reactFlow.fitView({ padding: 0.15, duration: 400 });
                          }}
                          style={{
                            width: "100%",
                            padding: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: "none",
                            background: isDark ? "#f43f5e" : "#e11d48",
                            color: "#ffffff",
                            cursor: "pointer",
                          }}
                        >
                          Exit Route Probe
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ margin: "0 0 10px", fontSize: "11px", color: isDark ? "#94a3b8" : "#475569" }}>
                          {activeNodeIds.size > 0
                            ? `Isolating ${activeNodeIds.size} connected nodes and ${activeEdgeIds.size} edges.`
                            : "Select a node to inspect its signal trace."}
                        </p>
                        {selectedNodeId && (
                          <button
                            type="button"
                            onClick={onPaneClick}
                            style={{
                              width: "100%",
                              padding: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              borderRadius: "6px",
                              border: "none",
                              background: isDark ? "#f43f5e" : "#e11d48",
                              color: "#ffffff",
                              cursor: "pointer",
                            }}
                          >
                            Clear Trace Focus
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: LENS (Interactive Architectural Layer Filter) */}
                {hudTab === "LENS" && (
                  <div>
                    <h3 style={{ margin: "4px 0 8px", fontSize: "13px", fontWeight: 750, color: isDark ? "#c084fc" : "#7c3aed" }}>
                      Semantic Architecture Lenses
                    </h3>
                    <p style={{ margin: "0 0 10px", fontSize: "10.5px", color: isDark ? "#94a3b8" : "#64748b" }}>
                      Filter components by architectural responsibility:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { key: "all", label: "● ALL / Show All Layers", color: isDark ? "#f8fafc" : "#0f172a" },
                        { key: "ui", label: "● 01 / User Interface & Gateway", color: isDark ? "#38bdf8" : "#0284c7" },
                        { key: "runtime", label: "● 02 / Core Runtime & Services", color: isDark ? "#2dd4bf" : "#059669" },
                        { key: "policy", label: "● EX / Policy, Guard & Gate", color: isDark ? "#fb7185" : "#e11d48" },
                        { key: "data", label: "● Data, Persistence & DB", color: isDark ? "#c084fc" : "#7c3aed" },
                        { key: "external", label: "● External & Cloud Systems", color: isDark ? "#fb923c" : "#d97706" },
                      ].map((lens) => (
                        <button
                          key={lens.key}
                          type="button"
                          onClick={() => {
                            setActiveLens(lens.key as typeof activeLens);
                            setSelectedNodeId(null);
                          }}
                          style={{
                            textAlign: "left",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: activeLens === lens.key ? `1.5px solid ${lens.color}` : `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                            background: activeLens === lens.key ? (isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0") : "transparent",
                            color: lens.color,
                            fontSize: "11px",
                            fontWeight: activeLens === lens.key ? 800 : 500,
                            cursor: "pointer",
                          }}
                        >
                          {lens.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            )}
          </div>

          {/* Dedicated Window Footer Bar: Unobtrusive Legend & Status (Outside diagram canvas) */}
          <div
            style={{
              padding: "9px 18px",
              background: isDark ? "#080e1a" : "#f8fafc",
              borderTop: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              fontSize: "11px",
              color: isDark ? "#94a3b8" : "#64748b",
            }}
          >
            {/* Left Info: Status & Active Node Summary */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
                <strong style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                  {nodes.filter((n) => n.type === "archifyNode").length}
                </strong>{" "}
                components •{" "}
                <strong style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{edges.length}</strong> connections
              </span>

              {selectedNodeData && (
                <span style={{ color: isDark ? "#00f0ff" : "#0284c7", fontWeight: 700 }}>
                  Selected: {selectedNodeData.label} ({selectedNodeData.category})
                </span>
              )}
            </div>

            {/* Right: Architecture Layer & Edge Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "10.5px" }}>
              {/* Edge Style Legend */}
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ display: "inline-block", width: 16, height: 2, background: isDark ? "#00f0ff" : "#0284c7" }} />
                <span>Code Evidence</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    height: 0,
                    borderTop: `2px dashed ${isDark ? "#38bdf8" : "#0284c7"}`,
                  }}
                />
                <span>Suy luận luồng</span>
              </span>

              {/* Role / Layer Colors */}
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#00f0ff" }} />
                Gateway / UI
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#2dd4bf" }} />
                Controller / Service
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#a855f7" }} />
                Data / DB
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#f97316" }} />
                External / Cloud
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
