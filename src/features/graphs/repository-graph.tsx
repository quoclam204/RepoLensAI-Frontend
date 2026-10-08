"use client";

import {
  Background,
  BackgroundVariant,
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
import { useLanguage } from "@/i18n/language-context";
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
  PackageIcon,
  AlertTriangleIcon,
  SearchIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CloseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  TagIcon,
  InputFlowIcon,
  OutputFlowIcon,
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

type WorkflowPresetKey =
  | "05-repo"
  | "repolens-arch"
  | "01-agent"
  | "02-workflow"
  | "03-sequence"
  | "04-dataflow"
  | "05-lifecycle";


export type ArchifyCategory = "ui" | "runtime" | "policy" | "data" | "cloud" | "bus" | "external";

export interface ArchifyCustomNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  kind?: string;
  role?: string;
  subtitle?: string;
  extraText?: string;
  tag?: string;
  iconType: "window" | "external" | "code" | "shield" | "menu" | "cloud" | "db" | "grid" | "package";
  category: ArchifyCategory;
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
  category: ArchifyCategory;
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
    // 1. FRONTEND: Client apps, browsers, mobile, UI -> Sky / Cyan
    ui: {
      border: "#38bdf8",
      glow: "rgba(56, 189, 248, 0.45)",
      bg: "#08192c",
      text: "#f0f9ff",
      subtext: "#38bdf8",
      laneBorder: "rgba(56, 189, 248, 0.4)",
      laneBg: "rgba(56, 189, 248, 0.02)",
      laneText: "#38bdf8",
    },
    // 2. BACKEND: Services, APIs, workers, daemons -> Emerald / Mint Green
    runtime: {
      border: "#2dd4bf",
      glow: "rgba(45, 212, 191, 0.45)",
      bg: "#061a16",
      text: "#f0fdf4",
      subtext: "#2dd4bf",
      laneBorder: "rgba(45, 212, 191, 0.4)",
      laneBg: "rgba(45, 212, 191, 0.02)",
      laneText: "#2dd4bf",
    },
    // 3. DATABASE: DBs, caches, stores, AI/ML -> Purple / Lavender
    data: {
      border: "#c084fc",
      glow: "rgba(192, 132, 252, 0.45)",
      bg: "#160e28",
      text: "#faf5ff",
      subtext: "#c084fc",
      laneBorder: "rgba(192, 132, 252, 0.4)",
      laneBg: "rgba(192, 132, 252, 0.02)",
      laneText: "#c084fc",
    },
    // 4. CLOUD: Managed services, CDN, infra -> Amber / Warm Gold
    cloud: {
      border: "#fbbf24",
      glow: "rgba(251, 191, 36, 0.45)",
      bg: "#201605",
      text: "#fefce8",
      subtext: "#fbbf24",
      laneBorder: "rgba(251, 191, 36, 0.4)",
      laneBg: "rgba(251, 191, 36, 0.02)",
      laneText: "#fbbf24",
    },
    // 5. SECURITY: Auth, secrets, guards, rules -> Rose / Pink
    policy: {
      border: "#fb7185",
      glow: "rgba(251, 113, 133, 0.45)",
      bg: "#220c18",
      text: "#fff1f2",
      subtext: "#fb7185",
      laneBorder: "rgba(251, 113, 133, 0.4)",
      laneBg: "rgba(251, 113, 133, 0.02)",
      laneText: "#fb7185",
    },
    // 6. MESSAGE BUS: Kafka, RabbitMQ, SNS, events -> Orange / Peach
    bus: {
      border: "#fb923c",
      glow: "rgba(251, 146, 60, 0.45)",
      bg: "#221106",
      text: "#fff7ed",
      subtext: "#fb923c",
      laneBorder: "rgba(251, 146, 60, 0.4)",
      laneBg: "rgba(251, 146, 60, 0.02)",
      laneText: "#fb923c",
    },
    // 7. EXTERNAL: Users, 3rd parties, generic -> Slate / Steel
    external: {
      border: "#94a3b8",
      glow: "rgba(148, 163, 184, 0.35)",
      bg: "#0f172a",
      text: "#f8fafc",
      subtext: "#94a3b8",
      laneBorder: "rgba(148, 163, 184, 0.4)",
      laneBg: "rgba(148, 163, 184, 0.02)",
      laneText: "#94a3b8",
    },
  },
  light: {
    // 1. FRONTEND: Client apps, browsers, mobile, UI -> Sky / Cyan
    ui: {
      border: "#0284c7",
      glow: "rgba(2, 132, 199, 0.28)",
      bg: "#f0f9ff",
      text: "#0c4a6e",
      subtext: "#0284c7",
      laneBorder: "rgba(2, 132, 199, 0.45)",
      laneBg: "rgba(2, 132, 199, 0.025)",
      laneText: "#0284c7",
    },
    // 2. BACKEND: Services, APIs, workers, daemons -> Emerald / Mint Green
    runtime: {
      border: "#059669",
      glow: "rgba(5, 150, 105, 0.28)",
      bg: "#ecfdf5",
      text: "#064e3b",
      subtext: "#059669",
      laneBorder: "rgba(5, 150, 105, 0.45)",
      laneBg: "rgba(5, 150, 105, 0.025)",
      laneText: "#059669",
    },
    // 3. DATABASE: DBs, caches, stores, AI/ML -> Purple / Lavender
    data: {
      border: "#7c3aed",
      glow: "rgba(124, 58, 237, 0.28)",
      bg: "#f5f3ff",
      text: "#4c1d95",
      subtext: "#7c3aed",
      laneBorder: "rgba(124, 58, 237, 0.45)",
      laneBg: "rgba(124, 58, 237, 0.025)",
      laneText: "#7c3aed",
    },
    // 4. CLOUD: Managed services, CDN, infra -> Amber / Warm Gold
    cloud: {
      border: "#d97706",
      glow: "rgba(217, 119, 6, 0.28)",
      bg: "#fffbeb",
      text: "#78350f",
      subtext: "#d97706",
      laneBorder: "rgba(217, 119, 6, 0.45)",
      laneBg: "rgba(217, 119, 6, 0.025)",
      laneText: "#d97706",
    },
    // 5. SECURITY: Auth, secrets, guards, rules -> Rose / Pink
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
    // 6. MESSAGE BUS: Kafka, RabbitMQ, SNS, events -> Orange / Peach
    bus: {
      border: "#ea580c",
      glow: "rgba(234, 88, 12, 0.28)",
      bg: "#fff7ed",
      text: "#7c2d12",
      subtext: "#ea580c",
      laneBorder: "rgba(234, 88, 12, 0.45)",
      laneBg: "rgba(234, 88, 12, 0.025)",
      laneText: "#ea580c",
    },
    // 7. EXTERNAL: Users, 3rd parties, generic -> Slate / Steel
    external: {
      border: "#475569",
      glow: "rgba(71, 85, 105, 0.22)",
      bg: "#f8fafc",
      text: "#1e293b",
      subtext: "#475569",
      laneBorder: "rgba(71, 85, 105, 0.45)",
      laneBg: "rgba(71, 85, 105, 0.025)",
      laneText: "#475569",
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
    case "package":
      return <PackageIcon size={size} color="currentColor" />;
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
  const isEdgeActive = !!data?.isEdgeActive;
  const showLabel = Boolean(data?.showLabel ?? isEdgeActive ?? isActive);
  const pulseKey = (data?.pulseKey as number) || 0;
  const strokeColor = (style.stroke as string) || (data?.color as string) || "#00f0ff";

  const isDark = (data?.theme as string) !== "light";
  const ioTag = typeof data?.ioTag === "string" ? data.ioTag : undefined;

  // Animation Progress 0.0 -> 1.0 driven by requestAnimationFrame (100% reliable across all browsers)
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setProgress(null);
      return;
    }

    let start: number | null = null;
    let animId: number;
    const duration = 2200; // 2.2 seconds: continuous smooth flow while active

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const p = (elapsed % duration) / duration;
      setProgress(p);

      animId = requestAnimationFrame(step);
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

      {/* Edge Label Badge - Interactive pill badge visible only when connected node is hovered/selected */}
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
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px) scale(${showLabel ? 1 : 0.85})`,
              pointerEvents: showLabel ? "all" : "none",
              cursor: "pointer",
              zIndex: showLabel ? 25 : 0,
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
              opacity: showLabel ? 1 : 0,
              visibility: showLabel ? "visible" : "hidden",
              transition: "opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease",
            }}
          >
            {ioTag && (
              <span
                style={{
                  marginRight: 5,
                  padding: "1px 5px",
                  borderRadius: 4,
                  fontSize: "8.5px",
                  fontWeight: 800,
                  background: ioTag === "IN"
                    ? (isDark ? "rgba(56, 189, 248, 0.22)" : "#e0f2fe")
                    : (isDark ? "rgba(16, 185, 129, 0.22)" : "#d1fae5"),
                  color: ioTag === "IN"
                    ? (isDark ? "#38bdf8" : "#0284c7")
                    : (isDark ? "#34d399" : "#059669"),
                  border: `1px solid ${ioTag === "IN" ? (isDark ? "#38bdf8" : "#0284c7") : (isDark ? "#34d399" : "#059669")}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                {ioTag === "IN" ? (
                  <>
                    <InputFlowIcon size={9} color="currentColor" />
                    <span>IN</span>
                  </>
                ) : (
                  <>
                    <OutputFlowIcon size={9} color="currentColor" />
                    <span>OUT</span>
                  </>
                )}
              </span>
            )}
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
    { id: "approval-gate", type: "archifyNode", position: { x: 595, y: 365 }, data: { id: "approval-gate", label: "Approval Gate", subtitle: "scope + consent", extraText: "block risky ops", iconType: "shield", category: "policy", theme } },
    { id: "blocked", type: "archifyNode", position: { x: 760, y: 365 }, data: { id: "blocked", label: "Blocked", subtitle: "wait or reject", iconType: "shield", category: "policy", theme } },
    { id: "retry-path", type: "archifyNode", position: { x: 900, y: 365 }, data: { id: "retry-path", label: "Retry Path", subtitle: "revise request", iconType: "menu", category: "external", theme } },
    { id: "context-store", type: "archifyNode", position: { x: 220, y: 525 }, data: { id: "context-store", label: "Context Store", subtitle: "session + state", iconType: "grid", category: "data", theme } },
    { id: "trace-log", type: "archifyNode", position: { x: 585, y: 525 }, data: { id: "trace-log", label: "Trace Log", subtitle: "append receipt", iconType: "grid", category: "data", theme } },
    { id: "local-tools", type: "archifyNode", position: { x: 755, y: 525 }, data: { id: "local-tools", label: "Tool Call", subtitle: "shell / browser / MCP", extraText: "structured result", iconType: "code", category: "bus", theme } },
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
    { id: "e4", source: "tool-router", target: "approval-gate", label: "needs approval?" },
    { id: "e5", source: "approval-gate", target: "blocked", label: "denied" },
    { id: "e5-approved", source: "approval-gate", target: "local-tools", label: "approved" },
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

// =========================================================================
// PRESET 01: RepoLens AI Clean Architecture SRS ("What is it made of?")
// 4 Horizontal Swimlanes, 12 Core Nodes, Multi-Branch Routing (3 outgoing paths)
// =========================================================================
export function buildRepoLensCleanArchitecture(theme: "dark" | "light"): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = [];
  const laneWidth = 1140;

  // Stages Top Marker
  nodes.push(
    { id: "stage-ingress", type: "stageNode", position: { x: 120, y: 15 }, zIndex: 0, data: { label: "01 • Ingress & Client", theme } },
    { id: "stage-pipeline", type: "stageNode", position: { x: 500, y: 15 }, zIndex: 0, data: { label: "02 • Orchestration & Analysis", theme } },
    { id: "stage-persistence", type: "stageNode", position: { x: 880, y: 15 }, zIndex: 0, data: { label: "03 • Grounded Persistence", theme } },
  );

  // 4 Horizontal Swimlanes
  nodes.push(
    {
      id: "lane-ingress",
      type: "boundaryNode",
      position: { x: 30, y: 45 },
      zIndex: -2,
      data: { id: "lane-ingress", label: "01 / PRESENTATION & INGRESS (Web / Client Layer)", category: "ui", width: laneWidth, height: 115, theme },
    },
    {
      id: "lane-orch",
      type: "boundaryNode",
      position: { x: 30, y: 190 },
      zIndex: -2,
      data: { id: "lane-orch", label: "02 / ORCHESTRATION & PIPELINE (Application Core & Workflow)", category: "runtime", width: laneWidth, height: 115, theme },
    },
    {
      id: "lane-static",
      type: "boundaryNode",
      position: { x: 30, y: 335 },
      zIndex: -2,
      data: { id: "lane-static", label: "03 / STATIC ANALYSIS & KNOWLEDGE ENGINE (Analysis Isolation)", category: "policy", width: laneWidth, height: 115, theme },
    },
    {
      id: "lane-persistence",
      type: "boundaryNode",
      position: { x: 30, y: 480 },
      zIndex: -2,
      data: { id: "lane-persistence", label: "04 / PERSISTENCE & GROUNDED AI (Storage & LLM Inference)", category: "data", width: laneWidth, height: 115, theme },
    },
  );

  // Lane 01 Nodes (Ingress & Web Layer)
  nodes.push(
    {
      id: "user",
      type: "archifyNode",
      position: { x: 60, y: 75 },
      zIndex: 5,
      data: {
        id: "user",
        label: "User / Client",
        tag: "CLIENT / ACTOR",
        subtitle: "browser or IDE client",
        role: "Triggers ingestion requests, visualizes live dependency graphs, and converses with Grounded RAG chat.",
        category: "external",
        iconType: "external",
        theme,
        detailCard: {
          nodeId: "user",
          title: "User / Client",
          role: "Client actor triggering repository analysis and conversational inquiries.",
          description: "Web browser or IDE client initiating repository analysis and submitting natural language queries.",
          upstreamNodes: [],
          downstreamNodes: ["frontend"],
        },
      },
    },
    {
      id: "frontend",
      type: "archifyNode",
      position: { x: 440, y: 75 },
      zIndex: 5,
      data: {
        id: "frontend",
        label: "Next.js Frontend",
        tag: "FRONTEND SPA",
        subtitle: "React SPA & SSE graph",
        role: "Consumes REST/SSE endpoints, handles user events, and visualizes multi-branch architecture graphs.",
        category: "ui",
        iconType: "window",
        theme,
        detailCard: {
          nodeId: "frontend",
          title: "Next.js Frontend",
          role: "Next.js 16 + React 19 visual client with React Flow canvas, symbol inspector, and SSE answer streaming.",
          description: "Interactive architecture graphs, real-time SSE streaming, and chat canvas.",
          upstreamNodes: ["user", "rag"],
          downstreamNodes: ["api"],
        },
      },
    },
    {
      id: "api",
      type: "archifyNode",
      position: { x: 820, y: 75 },
      zIndex: 5,
      data: {
        id: "api",
        label: "RepoLens.Api",
        tag: "INGRESS / API",
        subtitle: "ASP.NET Core REST gateway",
        role: "Exposes REST APIs, enforces tenant isolation, rejects unvalidated requests.",
        category: "ui",
        iconType: "menu",
        theme,
        extraText: "3 Outgoing Routes",
        detailCard: {
          nodeId: "api",
          title: "RepoLens.Api",
          role: "ASP.NET Core REST API gateway handling project submission, queries, and chat endpoints.",
          description: "Exposes REST APIs, enforces tenant isolation, rejects unvalidated requests.",
          upstreamNodes: ["frontend"],
          downstreamNodes: ["orchestrator", "postgres", "rag"],
        },
      },
    },
  );

  // Lane 02 Nodes (Orchestration & Workflow)
  nodes.push(
    {
      id: "orchestrator",
      type: "archifyNode",
      position: { x: 120, y: 220 },
      zIndex: 5,
      data: {
        id: "orchestrator",
        label: "Pipeline Orchestrator",
        tag: "ORCHESTRATION",
        subtitle: "lifecycle state machine",
        role: "State machine driving lifecycle: Created -> Acquiring -> Scanning -> Analyzing -> Indexing -> Completed / Failed.",
        category: "runtime",
        iconType: "code",
        theme,
        extraText: "3 Outgoing Paths",
        detailCard: {
          nodeId: "orchestrator",
          title: "Pipeline Orchestrator",
          role: "State machine driving lifecycle: Created -> Acquiring -> Scanning -> Analyzing -> Indexing -> Completed / Failed.",
          description: "State machine driving analysis lifecycle (Created -> Acquiring -> Scanning -> Analyzing -> Indexing -> Completed / Failed).",
          upstreamNodes: ["api"],
          downstreamNodes: ["security", "roslyn", "ast"],
        },
      },
    },
    {
      id: "security",
      type: "archifyNode",
      position: { x: 480, y: 220 },
      zIndex: 5,
      data: {
        id: "security",
        label: "Security Guard",
        tag: "POLICY / SECURITY",
        subtitle: "read-only sandbox & redactor",
        role: "Enforces read-only untrusted input isolation, zip-bomb prevention, and credential redaction.",
        category: "policy",
        iconType: "shield",
        theme,
        detailCard: {
          nodeId: "security",
          title: "Security Guard",
          role: "Enforces read-only untrusted input isolation, zip-bomb prevention, and credential redaction.",
          description: "Enforces read-only untrusted input isolation, zip-bomb prevention, and credential redaction.",
          upstreamNodes: ["orchestrator"],
          downstreamNodes: ["scanner"],
        },
      },
    },
    {
      id: "scanner",
      type: "archifyNode",
      position: { x: 820, y: 220 },
      zIndex: 5,
      data: {
        id: "scanner",
        label: "Acquisition & Scanner",
        tag: "INGESTION",
        subtitle: "unpack & git clone",
        role: "Extracts files to ephemeral sandbox workspace and yields clean file manifest to parsers.",
        category: "runtime",
        iconType: "package",
        theme,
        detailCard: {
          nodeId: "scanner",
          title: "Acquisition & Scanner",
          role: "Clones remote git repositories or unpacks uploaded ZIP bundles, applies ignore lists (.gitignore, node_modules).",
          description: "Clones remote git repositories or unpacks uploaded ZIP bundles, applies ignore lists (.gitignore, node_modules).",
          upstreamNodes: ["security"],
          downstreamNodes: ["roslyn", "ast"],
        },
      },
    },
  );

  // Lane 03 Nodes (Static Engine & Knowledge Graph)
  nodes.push(
    {
      id: "roslyn",
      type: "archifyNode",
      position: { x: 60, y: 365 },
      zIndex: 5,
      data: {
        id: "roslyn",
        label: "Roslyn C# Analyzer",
        tag: "STATIC ANALYSIS",
        subtitle: "C# AST & symbols",
        role: "Extracts C# symbols, AST syntax trees, inheritance, method calls, and project references.",
        category: "runtime",
        iconType: "code",
        theme,
        detailCard: {
          nodeId: "roslyn",
          title: "Roslyn C# Analyzer",
          role: "Extracts C# symbols, AST syntax trees, inheritance, method calls, and project references.",
          description: "Extracts C# symbols, AST syntax trees, inheritance, method calls, and project references.",
          upstreamNodes: ["orchestrator", "scanner"],
          downstreamNodes: ["kg"],
        },
      },
    },
    {
      id: "ast",
      type: "archifyNode",
      position: { x: 330, y: 365 },
      zIndex: 5,
      data: {
        id: "ast",
        label: "TS/JS AST Parser",
        tag: "STATIC ANALYSIS",
        subtitle: "component imports & routes",
        role: "Parses TypeScript/JavaScript AST, React component hierarchies, imports/exports, and API call hooks.",
        category: "runtime",
        iconType: "code",
        theme,
        detailCard: {
          nodeId: "ast",
          title: "TS/JS AST Parser",
          role: "Parses TypeScript/JavaScript AST, React component hierarchies, imports/exports, and API call hooks.",
          description: "Parses TypeScript/JavaScript AST, React component hierarchies, imports/exports, and API call hooks.",
          upstreamNodes: ["orchestrator", "scanner"],
          downstreamNodes: ["kg"],
        },
      },
    },
    {
      id: "kg",
      type: "archifyNode",
      position: { x: 600, y: 365 },
      zIndex: 5,
      data: {
        id: "kg",
        label: "Knowledge Graph Builder",
        tag: "DOMAIN MODEL",
        subtitle: "structural domain graph",
        role: "Maps structural nodes (Project, Symbol, File, API, DB) and relationships (CONTAINS, DEPENDS_ON, CALLS, EXPOSES).",
        category: "bus",
        iconType: "grid",
        theme,
        extraText: "3 Outgoing Paths",
        detailCard: {
          nodeId: "kg",
          title: "Knowledge Graph Builder",
          role: "Maps structural nodes (Project, Symbol, File, API, DB) and relationships (CONTAINS, DEPENDS_ON, CALLS, EXPOSES).",
          description: "Maps structural nodes (Project, Symbol, File, API, DB) and relationships (CONTAINS, DEPENDS_ON, CALLS, EXPOSES).",
          upstreamNodes: ["roslyn", "ast"],
          downstreamNodes: ["postgres", "evidence", "vector"],
        },
      },
    },
    {
      id: "evidence",
      type: "archifyNode",
      position: { x: 880, y: 365 },
      zIndex: 5,
      data: {
        id: "evidence",
        label: "Evidence Engine",
        tag: "TRACEABILITY",
        subtitle: "ground truth anchor",
        role: "Ground truth anchor pinning facts to file paths, symbol signatures, and line ranges.",
        category: "policy",
        iconType: "shield",
        theme,
        detailCard: {
          nodeId: "evidence",
          title: "Evidence Engine",
          role: "Ground truth anchor pinning facts to file paths, symbol signatures, and line ranges.",
          description: "Ground truth anchor pinning facts to file paths, symbol signatures, and line ranges.",
          upstreamNodes: ["kg", "rag"],
          downstreamNodes: ["rag"],
        },
      },
    },
  );

  // Lane 04 Nodes (Persistence & Grounded AI)
  nodes.push(
    {
      id: "postgres",
      type: "archifyNode",
      position: { x: 100, y: 510 },
      zIndex: 5,
      data: {
        id: "postgres",
        label: "PostgreSQL (EF Core)",
        tag: "DATABASE",
        subtitle: "relational code entities",
        role: "Relational storage for symbols, dependencies, endpoints, schema entities, and analyses.",
        category: "data",
        iconType: "db",
        theme,
        detailCard: {
          nodeId: "postgres",
          title: "PostgreSQL (EF Core)",
          role: "Relational storage for symbols, dependencies, endpoints, schema entities, and analyses.",
          description: "Relational storage for symbols, dependencies, endpoints, schema entities, and analyses.",
          upstreamNodes: ["api", "kg"],
          downstreamNodes: [],
        },
      },
    },
    {
      id: "vector",
      type: "archifyNode",
      position: { x: 480, y: 510 },
      zIndex: 5,
      data: {
        id: "vector",
        label: "Vector Index (pgvector)",
        tag: "VECTOR STORE",
        subtitle: "HNSW embeddings index",
        role: "Embeddings index for code chunks and documentation retrieval.",
        category: "data",
        iconType: "db",
        theme,
        detailCard: {
          nodeId: "vector",
          title: "Vector Index (pgvector)",
          role: "Embeddings index for code chunks and documentation retrieval.",
          description: "Embeddings index for code chunks and documentation retrieval.",
          upstreamNodes: ["kg", "rag"],
          downstreamNodes: ["rag"],
        },
      },
    },
    {
      id: "rag",
      type: "archifyNode",
      position: { x: 820, y: 510 },
      zIndex: 5,
      data: {
        id: "rag",
        label: "Grounded RAG Engine",
        tag: "AI INFERENCE",
        subtitle: "verified context LLM",
        role: "Context retriever and LLM answering engine with strict confidence ratings (High / Medium / Low / Unknown).",
        category: "cloud",
        iconType: "cloud",
        theme,
        extraText: "3 Verification Branches",
        detailCard: {
          nodeId: "rag",
          title: "Grounded RAG Engine",
          role: "Context retriever and LLM answering engine with strict confidence ratings (High / Medium / Low / Unknown).",
          description: "Context retriever and LLM answering engine with strict confidence ratings (High / Medium / Low / Unknown).",
          upstreamNodes: ["api", "vector", "evidence"],
          downstreamNodes: ["frontend"],
        },
      },
    },
  );

  // Multi-Branch Edges
  const rawEdges = [
    { id: "e-user-fe", source: "user", target: "frontend", label: "interacts" },
    { id: "e-fe-api", source: "frontend", target: "api", label: "HTTP / REST" },

    // Branch 1: RepoLens.Api (3 Outgoing Routes)
    { id: "e-api-orch", source: "api", target: "orchestrator", label: "1. [async-dispatch]" },
    { id: "e-api-db", source: "api", target: "postgres", label: "2. [direct-query]" },
    { id: "e-api-rag", source: "api", target: "rag", label: "3. [chat-query]" },

    // Branch 2: Pipeline Orchestrator (3 Outgoing Paths)
    { id: "e-orch-sec", source: "orchestrator", target: "security", label: "1. [acquire & guard]" },
    { id: "e-sec-scan", source: "security", target: "scanner", label: "cleared payload" },
    { id: "e-orch-roslyn", source: "orchestrator", target: "roslyn", label: "2. [trigger-analysis]" },
    { id: "e-orch-ast", source: "orchestrator", target: "ast", label: "dispatch TS" },
    { id: "e-scan-roslyn", source: "scanner", target: "roslyn", label: "C# source files" },
    { id: "e-scan-ast", source: "scanner", target: "ast", label: "TS/JS source files" },

    // Roslyn & AST to Knowledge Graph
    { id: "e-roslyn-kg", source: "roslyn", target: "kg", label: "C# symbols & calls" },
    { id: "e-ast-kg", source: "ast", target: "kg", label: "component imports" },

    // Branch 3: Knowledge Graph Builder (3 Outgoing Paths)
    { id: "e-kg-pg", source: "kg", target: "postgres", label: "1. [persist-relational]" },
    { id: "e-kg-ev", source: "kg", target: "evidence", label: "2. [link-evidence]" },
    { id: "e-kg-vec", source: "kg", target: "vector", label: "3. [chunk-for-rag]" },

    // Branch 4: Grounded RAG Engine (3 Verification Branches)
    { id: "e-rag-vec", source: "rag", target: "vector", label: "1. [similarity-search]" },
    { id: "e-rag-ev", source: "rag", target: "evidence", label: "2. [verify-ground-truth]" },
    { id: "e-rag-fe", source: "rag", target: "frontend", label: "3. [stream-answer]" },
  ];

  const nodePosMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    if (n.type === "archifyNode") {
      nodePosMap.set(n.id, n.position);
    }
  });

  const isDark = theme === "dark";
  const edgeColor = isDark ? "#00f0ff" : "#0284c7";

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

// =========================================================================
// PRESET: Release Delivery Workflow ("Release Delivery Workflow")
// 6 Horizontal Swimlanes, 10 Core Nodes, Multi-Branch Routing (Quality Gates & Verify)
// =========================================================================
export function buildReleaseDeliveryWorkflow(theme: "dark" | "light"): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = [];
  const laneWidth = 1140;

  // Stages Top Marker
  nodes.push(
    { id: "st-rel-change", type: "stageNode", position: { x: 180, y: 15 }, zIndex: 0, data: { label: "01 • Change", theme } },
    { id: "st-rel-build", type: "stageNode", position: { x: 520, y: 15 }, zIndex: 0, data: { label: "02 • Build + Verify", theme } },
    { id: "st-rel-promote", type: "stageNode", position: { x: 860, y: 15 }, zIndex: 0, data: { label: "03 • Promote + Observe", theme } },
  );

  // 6 Horizontal Swimlanes
  nodes.push(
    {
      id: "lane-rel-dev",
      type: "boundaryNode",
      position: { x: 30, y: 45 },
      zIndex: -2,
      data: { id: "lane-rel-dev", label: "01 / DEVELOPER", category: "ui", width: laneWidth, height: 115, theme },
    },
    {
      id: "lane-rel-ci",
      type: "boundaryNode",
      position: { x: 30, y: 190 },
      zIndex: -2,
      data: { id: "lane-rel-ci", label: "02 / CONTINUOUS INTEGRATION", category: "runtime", width: laneWidth, height: 115, theme },
    },
    {
      id: "lane-rel-gov",
      type: "boundaryNode",
      position: { x: 30, y: 335 },
      zIndex: -2,
      data: { id: "lane-rel-gov", label: "03 / RELEASE GOVERNANCE", category: "policy", width: laneWidth, height: 115, theme },
    },
    {
      id: "lane-rel-prod",
      type: "boundaryNode",
      position: { x: 30, y: 480 },
      zIndex: -2,
      data: { id: "lane-rel-prod", label: "04 / PRODUCTION ENVIRONMENT", category: "cloud", width: laneWidth, height: 115, theme },
    },
    {
      id: "lane-rel-comm",
      type: "boundaryNode",
      position: { x: 30, y: 625 },
      zIndex: -2,
      data: { id: "lane-rel-comm", label: "05 / RELEASE COMMUNICATION", category: "external", width: laneWidth, height: 115, theme },
    },
    {
      id: "lane-rel-fail",
      type: "boundaryNode",
      position: { x: 30, y: 770 },
      zIndex: -2,
      data: { id: "lane-rel-fail", label: "EX / FAILURE + ROLLBACK (RECOVERY PATH)", category: "policy", width: laneWidth, height: 125, theme },
    },
  );

  // Lane 01 Nodes (Developer)
  nodes.push(
    {
      id: "rel-commit",
      type: "archifyNode",
      position: { x: 80, y: 75 },
      zIndex: 5,
      data: {
        id: "rel-commit",
        label: "Commit",
        tag: "SIGNED CHANGE",
        subtitle: "signed change",
        role: "Cryptographically signed developer change.",
        category: "ui",
        iconType: "window",
        theme,
        detailCard: {
          nodeId: "rel-commit",
          title: "Commit",
          role: "Signed developer commit",
          description: "Developer pushes signed Git commit containing code changes and unit tests.",
          upstreamNodes: [],
          downstreamNodes: ["rel-pull-request"],
        },
      },
    },
    {
      id: "rel-pull-request",
      type: "archifyNode",
      position: { x: 360, y: 75 },
      zIndex: 5,
      data: {
        id: "rel-pull-request",
        label: "Pull Request",
        tag: "REVIEWED DIFF",
        subtitle: "reviewed diff",
        role: "Peer-reviewed diff and branch validation.",
        category: "ui",
        iconType: "window",
        theme,
        detailCard: {
          nodeId: "rel-pull-request",
          title: "Pull Request",
          role: "Code review and pull request",
          description: "Pull request workflow enforcing code reviews, diff validation, and branch policies.",
          upstreamNodes: ["rel-commit"],
          downstreamNodes: ["rel-build"],
        },
      },
    },
  );

  // Lane 02 Nodes (Continuous Integration)
  nodes.push(
    {
      id: "rel-build",
      type: "archifyNode",
      position: { x: 360, y: 220 },
      zIndex: 5,
      data: {
        id: "rel-build",
        label: "Build",
        tag: "LOCKED INPUTS",
        subtitle: "locked inputs",
        extraText: "reproducible",
        role: "Hermetic containerized build agent.",
        category: "runtime",
        iconType: "code",
        theme,
        detailCard: {
          nodeId: "rel-build",
          title: "Build",
          role: "CI build agent",
          description: "Hermetic, reproducible compilation from locked package manifests.",
          upstreamNodes: ["rel-pull-request"],
          downstreamNodes: ["rel-quality-gates"],
        },
      },
    },
    {
      id: "rel-quality-gates",
      type: "archifyNode",
      position: { x: 640, y: 220 },
      zIndex: 5,
      data: {
        id: "rel-quality-gates",
        label: "Quality Gates",
        tag: "TEST + SCAN",
        subtitle: "test + scan",
        extraText: "2 Outgoing Paths",
        role: "Automated test suites, security scans, and code coverage checks.",
        category: "policy",
        iconType: "shield",
        theme,
        detailCard: {
          nodeId: "rel-quality-gates",
          title: "Quality Gates",
          role: "Quality & security gatekeeper",
          description: "Enforces unit/integration tests, SAST vulnerability scanning, and license compliance.",
          upstreamNodes: ["rel-build"],
          downstreamNodes: ["rel-approve", "rel-stop-release"],
        },
      },
    },
  );

  // Lane 03 Nodes (Release Governance)
  nodes.push(
    {
      id: "rel-approve",
      type: "archifyNode",
      position: { x: 760, y: 365 },
      zIndex: 5,
      data: {
        id: "rel-approve",
        label: "Approve",
        tag: "RELEASE OWNER",
        subtitle: "release owner",
        role: "Explicit authorization from the release owner.",
        category: "policy",
        iconType: "shield",
        theme,
        detailCard: {
          nodeId: "rel-approve",
          title: "Approve",
          role: "Release authorization gate",
          description: "Authorized release manager approval gate.",
          upstreamNodes: ["rel-quality-gates"],
          downstreamNodes: ["rel-deploy"],
        },
      },
    },
  );

  // Lane 04 Nodes (Production Environment)
  nodes.push(
    {
      id: "rel-deploy",
      type: "archifyNode",
      position: { x: 640, y: 510 },
      zIndex: 5,
      data: {
        id: "rel-deploy",
        label: "Deploy",
        tag: "CANARY 10%",
        subtitle: "canary 10%",
        role: "Canary rollout to progressive traffic partitions.",
        category: "cloud",
        iconType: "cloud",
        theme,
        detailCard: {
          nodeId: "rel-deploy",
          title: "Deploy",
          role: "Canary deployment runner",
          description: "Deploys container image to 10% canary traffic pool in production.",
          upstreamNodes: ["rel-approve", "rel-rollback"],
          downstreamNodes: ["rel-verify"],
        },
      },
    },
    {
      id: "rel-verify",
      type: "archifyNode",
      position: { x: 920, y: 510 },
      zIndex: 5,
      data: {
        id: "rel-verify",
        label: "Verify",
        tag: "SMOKE + SLO",
        subtitle: "smoke + SLO",
        extraText: "2 Outgoing Paths",
        role: "Production canary telemetry and SLO monitoring.",
        category: "runtime",
        iconType: "code",
        theme,
        detailCard: {
          nodeId: "rel-verify",
          title: "Verify",
          role: "Canary health monitor",
          description: "Monitors latency, error budgets, and synthetic smoke tests on canary instances.",
          upstreamNodes: ["rel-deploy"],
          downstreamNodes: ["rel-announce", "rel-rollback"],
        },
      },
    },
  );

  // Lane 05 Nodes (Release Communication)
  nodes.push(
    {
      id: "rel-announce",
      type: "archifyNode",
      position: { x: 920, y: 655 },
      zIndex: 5,
      data: {
        id: "rel-announce",
        label: "Announce",
        tag: "STATUS + NOTES",
        subtitle: "status + notes",
        role: "Automated broadcast of release notes and deployment status.",
        category: "external",
        iconType: "external",
        theme,
        detailCard: {
          nodeId: "rel-announce",
          title: "Announce",
          role: "Release broadcast",
          description: "Publishes release notes, notifies on-call teams, and records audit changelogs.",
          upstreamNodes: ["rel-verify"],
          downstreamNodes: [],
        },
      },
    },
  );

  // Lane 06 Nodes (Failure + Rollback)
  nodes.push(
    {
      id: "rel-stop-release",
      type: "archifyNode",
      position: { x: 360, y: 800 },
      zIndex: 5,
      data: {
        id: "rel-stop-release",
        label: "Stop Release",
        tag: "GATE FAILED",
        subtitle: "gate failed",
        role: "Immediate abort of deployment pipeline.",
        category: "policy",
        iconType: "shield",
        theme,
        detailCard: {
          nodeId: "rel-stop-release",
          title: "Stop Release",
          role: "Pipeline abort action",
          description: "Aborts the release pipeline and triggers alerts when quality gates fail.",
          upstreamNodes: ["rel-quality-gates"],
          downstreamNodes: [],
        },
      },
    },
    {
      id: "rel-rollback",
      type: "archifyNode",
      position: { x: 760, y: 800 },
      zIndex: 5,
      data: {
        id: "rel-rollback",
        label: "Rollback",
        tag: "LAST GOOD IMAGE",
        subtitle: "last good image",
        extraText: "Recovery Path",
        role: "Automated rollback to the last verified stable image.",
        category: "bus",
        iconType: "package",
        theme,
        detailCard: {
          nodeId: "rel-rollback",
          title: "Rollback",
          role: "Automated recovery mechanism",
          description: "Restores previous known-good deployment upon canary SLO breach.",
          upstreamNodes: ["rel-verify"],
          downstreamNodes: ["rel-deploy"],
        },
      },
    },
  );

  // Multi-Branch Edges
  const rawEdges = [
    { id: "e-rel-1", source: "rel-commit", target: "rel-pull-request", label: "commits" },
    { id: "e-rel-2", source: "rel-pull-request", target: "rel-build", label: "merge" },
    { id: "e-rel-3", source: "rel-build", target: "rel-quality-gates", label: "artifacts" },
    // Multi-branch from Quality Gates
    { id: "e-rel-4", source: "rel-quality-gates", target: "rel-approve", label: "passed" },
    { id: "e-rel-5", source: "rel-quality-gates", target: "rel-stop-release", label: "red / failed" },
    // Approve to Deploy
    { id: "e-rel-6", source: "rel-approve", target: "rel-deploy", label: "sign-off" },
    // Deploy to Verify
    { id: "e-rel-7", source: "rel-deploy", target: "rel-verify", label: "canary 10%" },
    // Multi-branch from Verify
    { id: "e-rel-8", source: "rel-verify", target: "rel-announce", label: "healthy" },
    { id: "e-rel-9", source: "rel-verify", target: "rel-rollback", label: "SLO breach" },
    // Recovery Path: Rollback to Deploy
    { id: "e-rel-10", source: "rel-rollback", target: "rel-deploy", label: "restore" },
  ];

  const nodePosMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    if (n.type === "archifyNode") nodePosMap.set(n.id, n.position);
  });

  const isDark = theme === "dark";
  const edgeColor = isDark ? "#00f0ff" : "#0284c7";

  const edges: Edge[] = rawEdges.map((e) => {
    const sPos = nodePosMap.get(e.source) || { x: 0, y: 0 };
    const tPos = nodePosMap.get(e.target) || { x: 0, y: 0 };
    const { sourceHandle, targetHandle } = getOptimalHandles(sPos, tPos);

    const isFailureEdge = e.id === "e-rel-5" || e.id === "e-rel-9";
    const isRecoveryEdge = e.id === "e-rel-10";
    const stroke = isFailureEdge
      ? (isDark ? "#f43f5e" : "#e11d48")
      : isRecoveryEdge
      ? (isDark ? "#c084fc" : "#9333ea")
      : edgeColor;

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle,
      targetHandle,
      label: e.label,
      type: "archifyEdge",
      animated: isFailureEdge || isRecoveryEdge,
      markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 14, height: 14 },
      style: {
        stroke,
        strokeWidth: 2,
        strokeDasharray: isFailureEdge || isRecoveryEdge ? "5 5" : undefined,
      },
      data: { theme },
    };
  });

  return { nodes, edges };
}

// =========================================================================
// Real Repository Workflow Builder (Grounding from CI/CD YAML files)
// =========================================================================
export function buildWorkflowFromDiagramDto(
  diagram: DiagramDto,
  theme: "dark" | "light",
): { nodes: FlowNode[]; edges: Edge[] } {
  if (!diagram || !diagram.nodes || diagram.nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes: FlowNode[] = [];
  const isDark = theme === "dark";

  const detailCardMap = new Map<string, DiagramDetailCardDto>();
  if (diagram.detailCards) {
    for (const card of diagram.detailCards) {
      if (card && card.nodeId) detailCardMap.set(card.nodeId, card);
    }
  }

  // Compute topological rank / depth for each node
  const inDegree = new Map<string, number>();
  const childrenMap = new Map<string, string[]>();
  for (const n of diagram.nodes) {
    inDegree.set(n.id, 0);
    childrenMap.set(n.id, []);
  }

  if (diagram.edges) {
    for (const e of diagram.edges) {
      if (childrenMap.has(e.from) && inDegree.has(e.to)) {
        childrenMap.get(e.from)!.push(e.to);
        inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
      }
    }
  }

  const depthMap = new Map<string, number>();
  const queue: string[] = [];

  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      depthMap.set(id, 0);
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currDepth = depthMap.get(curr) || 0;
    const children = childrenMap.get(curr) || [];
    for (const ch of children) {
      const nextDepth = Math.max(depthMap.get(ch) || 0, currDepth + 1);
      depthMap.set(ch, nextDepth);
      const remainingDeg = (inDegree.get(ch) || 1) - 1;
      inDegree.set(ch, remainingDeg);
      if (remainingDeg <= 0) {
        queue.push(ch);
      }
    }
  }

  for (const n of diagram.nodes) {
    if (!depthMap.has(n.id)) {
      depthMap.set(n.id, n.kind === "trigger" ? 0 : 1);
    }
  }

  let maxDepth = 0;
  for (const d of depthMap.values()) {
    if (d > maxDepth) maxDepth = d;
  }
  const laneWidth = Math.max(1160, (maxDepth + 1) * 280 + 120);

  const stageColWidth = laneWidth / 3;
  nodes.push(
    {
      id: "st-wf-1",
      type: "stageNode",
      position: { x: 40, y: 15 },
      zIndex: 0,
      data: { label: "Change / Trigger", theme },
    },
    {
      id: "st-wf-2",
      type: "stageNode",
      position: { x: 40 + stageColWidth, y: 15 },
      zIndex: 0,
      data: { label: "Build + Verify", theme },
    },
    {
      id: "st-wf-3",
      type: "stageNode",
      position: { x: 40 + stageColWidth * 2, y: 15 },
      zIndex: 0,
      data: { label: "Promote + Observe", theme },
    },
  );

  nodes.push(
    {
      id: "lane-wf-1",
      type: "boundaryNode",
      position: { x: 25, y: 45 },
      zIndex: -2,
      data: { id: "lane-wf-1", label: "01 / Developer & Trigger", category: "ui", width: laneWidth, height: 135, theme },
    },
    {
      id: "lane-wf-2",
      type: "boundaryNode",
      position: { x: 25, y: 190 },
      zIndex: -2,
      data: { id: "lane-wf-2", label: "02 / Continuous Integration", category: "runtime", width: laneWidth, height: 135, theme },
    },
    {
      id: "lane-wf-3",
      type: "boundaryNode",
      position: { x: 25, y: 335 },
      zIndex: -2,
      data: { id: "lane-wf-3", label: "03 / Release Governance & Artifacts", category: "policy", width: laneWidth, height: 135, theme },
    },
    {
      id: "lane-wf-4",
      type: "boundaryNode",
      position: { x: 25, y: 480 },
      zIndex: -2,
      data: { id: "lane-wf-4", label: "04 / Production Environment", category: "cloud", width: laneWidth, height: 135, theme },
    },
    {
      id: "lane-wf-5",
      type: "boundaryNode",
      position: { x: 25, y: 625 },
      zIndex: -2,
      data: { id: "lane-wf-5", label: "05 / Release Communication", category: "bus", width: laneWidth, height: 135, theme },
    },
    {
      id: "lane-wf-6",
      type: "boundaryNode",
      position: { x: 25, y: 770 },
      zIndex: -2,
      data: { id: "lane-wf-6", label: "EX / Failure & Rollback", category: "policy", width: laneWidth, height: 135, theme },
    },
  );

  const laneYMap: Record<string, number> = {
    trigger: 75,
    ci: 220,
    package: 365,
    deploy: 510,
    comm: 655,
    rollback: 800,
  };

  const laneCountMap = new Map<string, number>();
  const nodePosMap = new Map<string, { x: number; y: number }>();

  for (const n of diagram.nodes) {
    const roleLower = (n.role || "").toLowerCase();
    const kindLower = (n.kind || "").toLowerCase();

    let laneKey = "ci";
    let category: ArchifyCustomNodeData["category"] = "runtime";
    let iconType: ArchifyCustomNodeData["iconType"] = "code";

    if (kindLower === "trigger" || roleLower === "trigger") {
      laneKey = "trigger";
      category = "ui";
      iconType = "window";
    } else if (roleLower.includes("rollback") || roleLower.includes("fail") || roleLower.includes("revert")) {
      laneKey = "rollback";
      category = "policy";
      iconType = "shield";
    } else if (roleLower.includes("comm") || roleLower.includes("notify") || roleLower.includes("slack")) {
      laneKey = "comm";
      category = "bus";
      iconType = "external";
    } else if (roleLower.includes("deploy") || roleLower.includes("prod") || roleLower.includes("cluster")) {
      laneKey = "deploy";
      category = "cloud";
      iconType = "cloud";
    } else if (roleLower.includes("package") || roleLower.includes("docker") || roleLower.includes("artifact")) {
      laneKey = "package";
      category = "policy";
      iconType = "package";
    } else if (roleLower.includes("test") || roleLower.includes("lint") || roleLower.includes("verify") || roleLower.includes("scan")) {
      laneKey = "ci";
      category = "runtime";
      iconType = "shield";
    } else {
      laneKey = "ci";
      category = "runtime";
      iconType = "code";
    }

    const depth = depthMap.get(n.id) || 0;
    const laneIndex = laneCountMap.get(`${laneKey}-${depth}`) || 0;
    laneCountMap.set(`${laneKey}-${depth}`, laneIndex + 1);

    const posX = 70 + depth * 270 + laneIndex * 15;
    const posY = (laneYMap[laneKey] ?? 220) + (laneIndex > 0 ? (laneIndex % 2 === 1 ? 12 : -12) : 0);

    nodePosMap.set(n.id, { x: posX, y: posY });

    const card = detailCardMap.get(n.id);
    const detailCard = card
      ? {
          nodeId: n.id,
          title: card.title || n.label,
          role: card.role || n.role,
          filePath: card.filePath,
          symbol: card.symbol,
          lineRange: card.lineRange,
          description: card.description || `Job thực thi trong quy trình CI/CD.`,
          upstreamNodes: card.upstreamNodes || [],
          downstreamNodes: card.downstreamNodes || [],
        }
      : {
          nodeId: n.id,
          title: n.label,
          role: n.role,
          filePath: n.evidence && n.evidence[0] ? n.evidence[0] : ".github/workflows",
          lineRange: n.evidence && n.evidence[1] ? n.evidence[1] : undefined,
          description: `Thành phần CI/CD: ${n.label}`,
          upstreamNodes: [],
          downstreamNodes: [],
        };

    const evidenceLine = n.evidence && n.evidence.length > 0 ? n.evidence.join(" ") : undefined;

    nodes.push({
      id: n.id,
      type: "archifyNode",
      position: { x: posX, y: posY },
      zIndex: 5,
      data: {
        id: n.id,
        label: n.label,
        tag: n.kind.toUpperCase(),
        subtitle: n.role,
        role: n.role,
        extraText: evidenceLine,
        category,
        iconType,
        theme,
        detailCard,
      },
    });
  }

  const edges: Edge[] = [];
  const edgeColor = isDark ? "#00f0ff" : "#0284c7";

  if (diagram.edges) {
    for (const e of diagram.edges) {
      const sPos = nodePosMap.get(e.from) || { x: 0, y: 0 };
      const tPos = nodePosMap.get(e.to) || { x: 0, y: 0 };
      const { sourceHandle, targetHandle } = getOptimalHandles(sPos, tPos);

      const isFailureEdge = (e.label || "").toLowerCase().includes("fail") || (e.kind || "").toLowerCase().includes("fail");
      const isRecoveryEdge = (e.label || "").toLowerCase().includes("rollback") || (e.label || "").toLowerCase().includes("revert");
      const stroke = isFailureEdge
        ? (isDark ? "#f43f5e" : "#e11d48")
        : isRecoveryEdge
        ? (isDark ? "#c084fc" : "#9333ea")
        : edgeColor;

      edges.push({
        id: e.id,
        source: e.from,
        target: e.to,
        sourceHandle,
        targetHandle,
        label: e.label || undefined,
        type: "archifyEdge",
        animated: isFailureEdge || isRecoveryEdge,
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 14, height: 14 },
        style: {
          stroke,
          strokeWidth: 2,
          strokeDasharray: e.isInferred || isFailureEdge || isRecoveryEdge ? "5 5" : undefined,
        },
        data: { theme },
      });
    }
  }

  return { nodes, edges };
}

// =========================================================================
// PRESET 02: Analysis Pipeline Workflow ("What happens next?")
// =========================================================================
export function buildAnalysisPipelineWorkflow(theme: "dark" | "light"): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = [];
  const laneWidth = 1100;

  nodes.push(
    { id: "st-wf-1", type: "stageNode", position: { x: 120, y: 15 }, zIndex: 0, data: { label: "Intake & Guard", theme } },
    { id: "st-wf-2", type: "stageNode", position: { x: 500, y: 15 }, zIndex: 0, data: { label: "Extraction & Graph", theme } },
    { id: "st-wf-3", type: "stageNode", position: { x: 860, y: 15 }, zIndex: 0, data: { label: "Persistence & Verification", theme } },
  );

  nodes.push(
    {
      id: "lane-wf-1",
      type: "boundaryNode",
      position: { x: 30, y: 45 },
      zIndex: -2,
      data: { id: "lane-wf-1", label: "STAGE 01 / REPOSITORY INTAKE & SECURITY", category: "ui", width: laneWidth, height: 125, theme },
    },
    {
      id: "lane-wf-2",
      type: "boundaryNode",
      position: { x: 30, y: 200 },
      zIndex: -2,
      data: { id: "lane-wf-2", label: "STAGE 02 / COMPILATION & KNOWLEDGE SYNTHESIS", category: "runtime", width: laneWidth, height: 125, theme },
    },
    {
      id: "lane-wf-3",
      type: "boundaryNode",
      position: { x: 30, y: 355 },
      zIndex: -2,
      data: { id: "lane-wf-3", label: "STAGE 03 / RELATIONAL & VECTOR PERSISTENCE", category: "data", width: laneWidth, height: 125, theme },
    },
  );

  nodes.push(
    {
      id: "wf-submit",
      type: "archifyNode",
      position: { x: 60, y: 80 },
      zIndex: 5,
      data: {
        id: "wf-submit",
        label: "Submit Repository",
        tag: "STEP 1",
        subtitle: "Git URL or ZIP archive",
        category: "ui",
        iconType: "window",
        theme,
      },
    },
    {
      id: "wf-security",
      type: "archifyNode",
      position: { x: 420, y: 80 },
      zIndex: 5,
      data: {
        id: "wf-security",
        label: "Security Audit",
        tag: "STEP 2",
        subtitle: "zip-bomb & secret check",
        category: "policy",
        iconType: "shield",
        theme,
      },
    },
    {
      id: "wf-clone",
      type: "archifyNode",
      position: { x: 780, y: 80 },
      zIndex: 5,
      data: {
        id: "wf-clone",
        label: "Acquisition & Filter",
        tag: "STEP 3",
        subtitle: "clean source sandbox",
        category: "runtime",
        iconType: "package",
        theme,
      },
    },
    {
      id: "wf-parse",
      type: "archifyNode",
      position: { x: 120, y: 235 },
      zIndex: 5,
      data: {
        id: "wf-parse",
        label: "Roslyn & AST Parsing",
        tag: "STEP 4",
        subtitle: "syntax trees & symbols",
        category: "runtime",
        iconType: "code",
        theme,
      },
    },
    {
      id: "wf-graph",
      type: "archifyNode",
      position: { x: 480, y: 235 },
      zIndex: 5,
      data: {
        id: "wf-graph",
        label: "Knowledge Graph Build",
        tag: "STEP 5",
        subtitle: "nodes, calls & dependencies",
        category: "bus",
        iconType: "grid",
        theme,
      },
    },
    {
      id: "wf-evidence",
      type: "archifyNode",
      position: { x: 800, y: 235 },
      zIndex: 5,
      data: {
        id: "wf-evidence",
        label: "Evidence Pinning",
        tag: "STEP 6",
        subtitle: "file path & line anchors",
        category: "policy",
        iconType: "shield",
        theme,
      },
    },
    {
      id: "wf-db",
      type: "archifyNode",
      position: { x: 160, y: 390 },
      zIndex: 5,
      data: {
        id: "wf-db",
        label: "Relational Persistence",
        tag: "STEP 7A",
        subtitle: "PostgreSQL EF Core",
        category: "data",
        iconType: "db",
        theme,
      },
    },
    {
      id: "wf-vector",
      type: "archifyNode",
      position: { x: 500, y: 390 },
      zIndex: 5,
      data: {
        id: "wf-vector",
        label: "Embeddings Index",
        tag: "STEP 7B",
        subtitle: "pgvector HNSW index",
        category: "data",
        iconType: "db",
        theme,
      },
    },
    {
      id: "wf-ready",
      type: "archifyNode",
      position: { x: 820, y: 390 },
      zIndex: 5,
      data: {
        id: "wf-ready",
        label: "Analysis Ready",
        tag: "STEP 8",
        subtitle: "architecture graph active",
        category: "cloud",
        iconType: "window",
        theme,
      },
    },
  );

  const rawEdges = [
    { id: "ew-1", source: "wf-submit", target: "wf-security", label: "validates payload" },
    { id: "ew-2", source: "wf-security", target: "wf-clone", label: "sanitized path" },
    { id: "ew-3", source: "wf-clone", target: "wf-parse", label: "filtered manifest" },
    { id: "ew-4", source: "wf-parse", target: "wf-graph", label: "symbols & calls" },
    { id: "ew-5", source: "wf-graph", target: "wf-evidence", label: "line spans" },
    { id: "ew-6", source: "wf-graph", target: "wf-db", label: "save entities" },
    { id: "ew-7", source: "wf-graph", target: "wf-vector", label: "chunk & embed" },
    { id: "ew-8", source: "wf-db", target: "wf-ready", label: "completed" },
    { id: "ew-9", source: "wf-vector", target: "wf-ready", label: "indexed" },
  ];

  const nodePosMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    if (n.type === "archifyNode") nodePosMap.set(n.id, n.position);
  });

  const isDark = theme === "dark";
  const edgeColor = isDark ? "#2dd4bf" : "#059669";

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

// =========================================================================
// PRESET 03: Sequence Workflow ("Who says what, in what order?")
// =========================================================================
export function buildApiSequenceWorkflow(theme: "dark" | "light"): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = [];
  const laneWidth = 1100;

  nodes.push(
    {
      id: "lane-seq-1",
      type: "boundaryNode",
      position: { x: 30, y: 45 },
      zIndex: -2,
      data: { id: "lane-seq-1", label: "01 / CLIENT & INGRESS", category: "ui", width: laneWidth, height: 120, theme },
    },
    {
      id: "lane-seq-2",
      type: "boundaryNode",
      position: { x: 30, y: 195 },
      zIndex: -2,
      data: { id: "lane-seq-2", label: "02 / APPLICATION ORCHESTRATION", category: "runtime", width: laneWidth, height: 120, theme },
    },
    {
      id: "lane-seq-3",
      type: "boundaryNode",
      position: { x: 30, y: 345 },
      zIndex: -2,
      data: { id: "lane-seq-3", label: "03 / STATIC ENGINES & EVIDENCE", category: "policy", width: laneWidth, height: 120, theme },
    },
    {
      id: "lane-seq-4",
      type: "boundaryNode",
      position: { x: 30, y: 495 },
      zIndex: -2,
      data: { id: "lane-seq-4", label: "04 / PERSISTENCE & RAG STREAM", category: "data", width: laneWidth, height: 120, theme },
    },
  );

  nodes.push(
    {
      id: "sq-client",
      type: "archifyNode",
      position: { x: 80, y: 75 },
      zIndex: 5,
      data: { id: "sq-client", label: "Web Client", tag: "PARTICIPANT 1", subtitle: "developer browser", category: "ui", iconType: "window", theme },
    },
    {
      id: "sq-api",
      type: "archifyNode",
      position: { x: 500, y: 75 },
      zIndex: 5,
      data: { id: "sq-api", label: "RepoLens.Api", tag: "PARTICIPANT 2", subtitle: "REST & SSE gateway", category: "ui", iconType: "menu", theme },
    },
    {
      id: "sq-orch",
      type: "archifyNode",
      position: { x: 260, y: 225 },
      zIndex: 5,
      data: { id: "sq-orch", label: "Orchestrator", tag: "PARTICIPANT 3", subtitle: "background worker", category: "runtime", iconType: "code", theme },
    },
    {
      id: "sq-roslyn",
      type: "archifyNode",
      position: { x: 700, y: 225 },
      zIndex: 5,
      data: { id: "sq-roslyn", label: "Roslyn Engine", tag: "PARTICIPANT 4", subtitle: "AST compiler", category: "runtime", iconType: "code", theme },
    },
    {
      id: "sq-kg",
      type: "archifyNode",
      position: { x: 260, y: 375 },
      zIndex: 5,
      data: { id: "sq-kg", label: "Graph Builder", tag: "PARTICIPANT 5", subtitle: "domain model", category: "bus", iconType: "grid", theme },
    },
    {
      id: "sq-evidence",
      type: "archifyNode",
      position: { x: 700, y: 375 },
      zIndex: 5,
      data: { id: "sq-evidence", label: "Evidence Engine", tag: "PARTICIPANT 6", subtitle: "code citations", category: "policy", iconType: "shield", theme },
    },
    {
      id: "sq-db",
      type: "archifyNode",
      position: { x: 260, y: 525 },
      zIndex: 5,
      data: { id: "sq-db", label: "Postgres + pgvector", tag: "PARTICIPANT 7", subtitle: "relational & vector", category: "data", iconType: "db", theme },
    },
    {
      id: "sq-rag",
      type: "archifyNode",
      position: { x: 700, y: 525 },
      zIndex: 5,
      data: { id: "sq-rag", label: "Grounded RAG", tag: "PARTICIPANT 8", subtitle: "verified answers", category: "cloud", iconType: "cloud", theme },
    },
  );

  const rawEdges = [
    { id: "es-1", source: "sq-client", target: "sq-api", label: "1.0 [POST /api/analyze]" },
    { id: "es-2", source: "sq-api", target: "sq-orch", label: "2.0 [Dispatch background job]" },
    { id: "es-3", source: "sq-orch", target: "sq-roslyn", label: "3.0 [Run AST parsing]" },
    { id: "es-4", source: "sq-roslyn", target: "sq-kg", label: "4.0 [Emit symbols & calls]" },
    { id: "es-5", source: "sq-kg", target: "sq-evidence", label: "5.0 [Pin exact line numbers]" },
    { id: "es-6", source: "sq-kg", target: "sq-db", label: "6.0 [Persist relational graph]" },
    { id: "es-7", source: "sq-client", target: "sq-api", label: "7.0 [POST /api/chat]" },
    { id: "es-8", source: "sq-api", target: "sq-rag", label: "8.0 [Query LLM with query]" },
    { id: "es-9", source: "sq-rag", target: "sq-db", label: "9.0 [pgvector search]" },
    { id: "es-10", source: "sq-rag", target: "sq-evidence", label: "10.0 [Verify citations]" },
    { id: "es-11", source: "sq-rag", target: "sq-client", label: "11.0 [Stream verified answer]" },
  ];

  const nodePosMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    if (n.type === "archifyNode") nodePosMap.set(n.id, n.position);
  });

  const isDark = theme === "dark";
  const edgeColor = isDark ? "#c084fc" : "#7c3aed";

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

// =========================================================================
// PRESET 04: Data Flow Workflow ("Where does it all go?")
// =========================================================================
export function buildDataFlowWorkflow(theme: "dark" | "light"): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = [];
  const laneWidth = 1100;

  nodes.push(
    {
      id: "lane-df-1",
      type: "boundaryNode",
      position: { x: 30, y: 45 },
      zIndex: -2,
      data: { id: "lane-df-1", label: "01 / RAW SOURCE CODE INPUTS", category: "external", width: laneWidth, height: 120, theme },
    },
    {
      id: "lane-df-2",
      type: "boundaryNode",
      position: { x: 30, y: 195 },
      zIndex: -2,
      data: { id: "lane-df-2", label: "02 / SYNTAX TREE & TOKEN EXTRACTION", category: "runtime", width: laneWidth, height: 120, theme },
    },
    {
      id: "lane-df-3",
      type: "boundaryNode",
      position: { x: 30, y: 345 },
      zIndex: -2,
      data: { id: "lane-df-3", label: "03 / SEMANTIC DOMAIN GRAPH", category: "bus", width: laneWidth, height: 120, theme },
    },
    {
      id: "lane-df-4",
      type: "boundaryNode",
      position: { x: 30, y: 495 },
      zIndex: -2,
      data: { id: "lane-df-4", label: "04 / PERSISTENT DATA TIERS", category: "data", width: laneWidth, height: 120, theme },
    },
  );

  nodes.push(
    {
      id: "df-cs",
      type: "archifyNode",
      position: { x: 120, y: 75 },
      zIndex: 5,
      data: { id: "df-cs", label: "*.cs Source Files", tag: "C# RAW", subtitle: ".NET solutions & projects", category: "runtime", iconType: "code", theme },
    },
    {
      id: "df-ts",
      type: "archifyNode",
      position: { x: 620, y: 75 },
      zIndex: 5,
      data: { id: "df-ts", label: "*.ts / *.tsx Files", tag: "TS/JS RAW", subtitle: "React components & hooks", category: "ui", iconType: "code", theme },
    },
    {
      id: "df-roslyn-tree",
      type: "archifyNode",
      position: { x: 120, y: 225 },
      zIndex: 5,
      data: { id: "df-roslyn-tree", label: "SyntaxTree & SemanticModel", tag: "ROSLYN AST", subtitle: "symbol table & invocation", category: "runtime", iconType: "code", theme },
    },
    {
      id: "df-ts-ast",
      type: "archifyNode",
      position: { x: 620, y: 225 },
      zIndex: 5,
      data: { id: "df-ts-ast", label: "TS Program AST", tag: "BABEL/TS AST", subtitle: "import/export specifiers", category: "ui", iconType: "code", theme },
    },
    {
      id: "df-nodes-edges",
      type: "archifyNode",
      position: { x: 370, y: 375 },
      zIndex: 5,
      data: { id: "df-nodes-edges", label: "CodeSymbol & DependencyGraph", tag: "NORMALIZED GRAPH", subtitle: "projects, files, APIs, entities", category: "bus", iconType: "grid", theme },
    },
    {
      id: "df-postgres",
      type: "archifyNode",
      position: { x: 120, y: 525 },
      zIndex: 5,
      data: { id: "df-postgres", label: "EF Core DbContext Tables", tag: "RELATIONAL", subtitle: "analyses, symbols, endpoints", category: "data", iconType: "db", theme },
    },
    {
      id: "df-pgvector",
      type: "archifyNode",
      position: { x: 620, y: 525 },
      zIndex: 5,
      data: { id: "df-pgvector", label: "pgvector 1536-dim Embeddings", tag: "VECTOR INDEX", subtitle: "code chunks & documentation", category: "data", iconType: "db", theme },
    },
  );

  const rawEdges = [
    { id: "edf-1", source: "df-cs", target: "df-roslyn-tree", label: "parsed by Roslyn" },
    { id: "edf-2", source: "df-ts", target: "df-ts-ast", label: "parsed by TS AST" },
    { id: "edf-3", source: "df-roslyn-tree", target: "df-nodes-edges", label: "extracts symbols & calls" },
    { id: "edf-4", source: "df-ts-ast", target: "df-nodes-edges", label: "extracts component imports" },
    { id: "edf-5", source: "df-nodes-edges", target: "df-postgres", label: "persists structural tables" },
    { id: "edf-6", source: "df-nodes-edges", target: "df-pgvector", label: "chunks & creates vectors" },
  ];

  const nodePosMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    if (n.type === "archifyNode") nodePosMap.set(n.id, n.position);
  });

  const isDark = theme === "dark";
  const edgeColor = isDark ? "#fbbf24" : "#d97706";

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

// =========================================================================
// PRESET 05: Lifecycle State Machine ("Where does it stand now?")
// =========================================================================
export function buildAnalysisLifecycleWorkflow(theme: "dark" | "light"): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = [];
  const laneWidth = 1100;

  nodes.push(
    {
      id: "lane-lc-1",
      type: "boundaryNode",
      position: { x: 30, y: 45 },
      zIndex: -2,
      data: { id: "lane-lc-1", label: "PHASE 01 / INITIATION & INTAKE", category: "ui", width: laneWidth, height: 120, theme },
    },
    {
      id: "lane-lc-2",
      type: "boundaryNode",
      position: { x: 30, y: 195 },
      zIndex: -2,
      data: { id: "lane-lc-2", label: "PHASE 02 / ANALYSIS & INDEXING", category: "runtime", width: laneWidth, height: 120, theme },
    },
    {
      id: "lane-lc-3",
      type: "boundaryNode",
      position: { x: 30, y: 345 },
      zIndex: -2,
      data: { id: "lane-lc-3", label: "PHASE 03 / TERMINAL OUTCOMES", category: "policy", width: laneWidth, height: 120, theme },
    },
  );

  nodes.push(
    {
      id: "lc-created",
      type: "archifyNode",
      position: { x: 120, y: 75 },
      zIndex: 5,
      data: { id: "lc-created", label: "Created", tag: "INITIAL", subtitle: "job queued in DB", category: "ui", iconType: "window", theme },
    },
    {
      id: "lc-acquiring",
      type: "archifyNode",
      position: { x: 480, y: 75 },
      zIndex: 5,
      data: { id: "lc-acquiring", label: "Acquiring", tag: "INTAKE", subtitle: "git clone or zip unpack", category: "runtime", iconType: "package", theme },
    },
    {
      id: "lc-scanning",
      type: "archifyNode",
      position: { x: 800, y: 75 },
      zIndex: 5,
      data: { id: "lc-scanning", label: "Scanning", tag: "FILTER", subtitle: "detect languages & files", category: "runtime", iconType: "shield", theme },
    },
    {
      id: "lc-analyzing",
      type: "archifyNode",
      position: { x: 280, y: 225 },
      zIndex: 5,
      data: { id: "lc-analyzing", label: "Analyzing", tag: "COMPILER", subtitle: "Roslyn AST & call graphs", category: "runtime", iconType: "code", theme },
    },
    {
      id: "lc-indexing",
      type: "archifyNode",
      position: { x: 680, y: 225 },
      zIndex: 5,
      data: { id: "lc-indexing", label: "Indexing", tag: "VECTOR EMBED", subtitle: "pgvector chunk vectors", category: "data", iconType: "db", theme },
    },
    {
      id: "lc-completed",
      type: "archifyNode",
      position: { x: 280, y: 375 },
      zIndex: 5,
      data: { id: "lc-completed", label: "Completed", tag: "SUCCESS", subtitle: "ready for exploration & RAG", category: "runtime", iconType: "window", theme },
    },
    {
      id: "lc-failed",
      type: "archifyNode",
      position: { x: 680, y: 375 },
      zIndex: 5,
      data: { id: "lc-failed", label: "Failed", tag: "TERMINAL ERROR", subtitle: "error recorded, clean sandbox", category: "policy", iconType: "shield", theme },
    },
  );

  const rawEdges = [
    { id: "elc-1", source: "lc-created", target: "lc-acquiring", label: "acquire start" },
    { id: "elc-2", source: "lc-acquiring", target: "lc-scanning", label: "unpacked successfully" },
    { id: "elc-3", source: "lc-scanning", target: "lc-analyzing", label: "manifest valid" },
    { id: "elc-4", source: "lc-analyzing", target: "lc-indexing", label: "graph extracted" },
    { id: "elc-5", source: "lc-indexing", target: "lc-completed", label: "indexing done (success)" },

    // Failure branch transitions
    { id: "elc-fail-1", source: "lc-acquiring", target: "lc-failed", label: "clone error" },
    { id: "elc-fail-2", source: "lc-analyzing", target: "lc-failed", label: "parse failure" },
    { id: "elc-fail-3", source: "lc-indexing", target: "lc-failed", label: "embedding timeout" },
  ];

  const nodePosMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    if (n.type === "archifyNode") nodePosMap.set(n.id, n.position);
  });

  const isDark = theme === "dark";
  const edgeColor = isDark ? "#38bdf8" : "#0284c7";

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

// Map components to the 7 Design System roles:
// 1. FRONTEND: Client apps, browsers, mobile, UI (Cyan / Sky)
// 2. BACKEND: Services, APIs, workers, daemons (Emerald / Mint)
// 3. DATABASE: DBs, caches, stores, AI/ML (Purple / Lavender)
// 4. CLOUD: Managed services, CDN, infra (Amber / Gold)
// 5. SECURITY: Auth, secrets, guards, rules (Rose / Pink)
// 6. MESSAGE BUS: Kafka, RabbitMQ, SNS, events (Orange / Peach)
// 7. EXTERNAL: Users, 3rd parties, generic (Slate / Steel)
export function resolveNodeCategory(
  role: string = "",
  kind: string = "",
  fallback: ArchifyCustomNodeData["category"] = "runtime",
): ArchifyCustomNodeData["category"] {
  const combined = `${role} ${kind}`.toLowerCase();

  // 1. SECURITY (Auth Provider, OAuth, Guard, Token, Rule) -> Rose
  if (
    combined.includes("auth") ||
    combined.includes("guard") ||
    combined.includes("security") ||
    combined.includes("policy") ||
    combined.includes("token") ||
    combined.includes("jwt") ||
    combined.includes("rule") ||
    combined.includes("shield")
  ) {
    return "policy";
  }

  // 2. MESSAGE BUS (Kafka, RabbitMQ, SNS, Event streams, Queue, Topic) -> Orange
  if (
    combined.includes("kafka") ||
    combined.includes("rabbit") ||
    combined.includes("queue") ||
    combined.includes("topic") ||
    combined.includes("bus") ||
    combined.includes("event") ||
    combined.includes("sns") ||
    combined.includes("sqs") ||
    combined.includes("broker")
  ) {
    return "bus";
  }

  // 3. CLOUD (CDN, CloudFront, S3, Infra, Managed Storage, Gateway) -> Amber
  if (
    combined.includes("cloud") ||
    combined.includes("cdn") ||
    combined.includes("cloudfront") ||
    combined.includes("s3") ||
    combined.includes("infra") ||
    combined.includes("storage") ||
    combined.includes("blob") ||
    combined.includes("bucket")
  ) {
    return "cloud";
  }

  // 4. DATABASE (Postgres, Mongo, Redis, Repository, Entity, DB) -> Purple
  if (
    combined.includes("db") ||
    combined.includes("database") ||
    combined.includes("postgres") ||
    combined.includes("sql") ||
    combined.includes("mongo") ||
    combined.includes("redis") ||
    combined.includes("repository") ||
    combined.includes("cache") ||
    combined.includes("entity") ||
    combined.includes("table") ||
    combined.includes("schema") ||
    combined.includes("dao")
  ) {
    return "data";
  }

  // 5. EXTERNAL (Users, 3rd parties, Browser, Mobile) -> Slate
  if (
    combined.includes("user") ||
    combined.includes("browser") ||
    combined.includes("external") ||
    combined.includes("3rdparty") ||
    combined.includes("thirdparty") ||
    combined.includes("vendor")
  ) {
    return "external";
  }

  // 6. FRONTEND (Web App, Client SPA, React, Route, Page, View, Component, UI) -> Cyan
  if (
    combined.includes("ui") ||
    combined.includes("frontend") ||
    combined.includes("page") ||
    combined.includes("route") ||
    combined.includes("spa") ||
    combined.includes("react") ||
    combined.includes("vue") ||
    combined.includes("component") ||
    combined.includes("view") ||
    combined.includes("client")
  ) {
    return "ui";
  }

  // 7. BACKEND (API Server, Controller, Service, Worker, Fastify, Backend) -> Emerald
  if (
    combined.includes("controller") ||
    combined.includes("service") ||
    combined.includes("api") ||
    combined.includes("server") ||
    combined.includes("backend") ||
    combined.includes("worker") ||
    combined.includes("handler") ||
    combined.includes("fastify") ||
    combined.includes("daemon")
  ) {
    return "runtime";
  }

  return fallback;
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

  // Deduplicate diagram.nodes by id to ensure React / ReactFlow / MiniMap never receives duplicate keys
  const seenNodeKeys = new Set<string>();
  const idRemap = new Map<string, string>();
  const sanitizedNodes: DiagramNodeDto[] = [];
  for (const n of diagram.nodes) {
    if (!n || !n.id) continue;
    let uniqueId = n.id;
    if (seenNodeKeys.has(uniqueId)) {
      let counter = 2;
      while (seenNodeKeys.has(`${n.id}-${counter}`)) {
        counter++;
      }
      uniqueId = `${n.id}-${counter}`;
      idRemap.set(n.id, uniqueId);
    }
    seenNodeKeys.add(uniqueId);
    sanitizedNodes.push(uniqueId === n.id ? n : { ...n, id: uniqueId });
  }

  // Group nodes by visual tiers based on their role
  const gatewayNodes: DiagramNodeDto[] = [];
  const controllerNodes: DiagramNodeDto[] = [];
  const serviceNodes: DiagramNodeDto[] = [];
  const dataNodes: DiagramNodeDto[] = [];
  const groupNodes: DiagramNodeDto[] = [];

  for (const n of sanitizedNodes) {
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

        if (kindLower === "project" || roleLower === "project" || kindLower === "package") nodeIcon = "package";
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
            category: resolveNodeCategory(comp.role, comp.kind, category),
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

  for (const edgeItem of diagram.edges || []) {
    const { id, from: rawSource, to: rawTarget, kind, label, confidence, isInferred } = edgeItem;
    const source = idRemap.get(rawSource) || rawSource;
    const target = idRemap.get(rawTarget) || rawTarget;
    if (source === target) continue;

    const pairKey = `${source}->${target}`;
    if (seenPairKeys.has(pairKey)) continue;
    seenPairKeys.add(pairKey);

    const sPos = nodePosMap.get(source);
    const tPos = nodePosMap.get(target);

    let sourceHandle = "r";
    let targetHandle = "l";
    if (sPos && tPos) {
      const handles = getOptimalHandles(sPos, tPos);
      sourceHandle = handles.sourceHandle;
      targetHandle = handles.targetHandle;
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
        if (isProject) nodeIcon = "package";
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

// Export Diagram Helper Icons
function ExportCopyIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ExportImageIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="10" cy="13" r="1.5" />
      <path d="M6 18l3-3 2 2 4-4 3 3" />
    </svg>
  );
}

function ExportCubeIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function recordWebMMotion(sourceCanvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const stream = sourceCanvas.captureStream(30);
      const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const chosenMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";

      const recorder = new MediaRecorder(stream, { mimeType: chosenMime });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: "video/webm" }));
      };

      recorder.onerror = (e) => {
        reject(e);
      };

      recorder.start();

      const ctx = sourceCanvas.getContext("2d");
      const startTime = performance.now();
      const duration = 6000;

      const offscreen = document.createElement("canvas");
      offscreen.width = sourceCanvas.width;
      offscreen.height = sourceCanvas.height;
      const offCtx = offscreen.getContext("2d");
      if (offCtx) offCtx.drawImage(sourceCanvas, 0, 0);

      const interval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        if (elapsed >= duration) {
          clearInterval(interval);
          recorder.stop();
          return;
        }

        if (ctx && offCtx) {
          ctx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
          ctx.drawImage(offscreen, 0, 0);

          const progress = elapsed / duration;
          const beamX = progress * (sourceCanvas.width + 400) - 200;
          const grad = ctx.createLinearGradient(beamX - 120, 0, beamX + 120, 0);
          grad.addColorStop(0, "rgba(0, 240, 255, 0)");
          grad.addColorStop(0.5, "rgba(0, 240, 255, 0.08)");
          grad.addColorStop(1, "rgba(0, 240, 255, 0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        }
      }, 1000 / 30);
    } catch (err) {
      reject(err);
    }
  });
}

function fitCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + "…").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.length > 0 ? truncated + "…" : text;
}

// Direct Canvas 2D Renderer (100% origin-clean, never taints the canvas, enabling flawless PNG/JPEG/WebP export)
function drawDiagramToCanvas(
  ctx: CanvasRenderingContext2D,
  nodes: FlowNode[],
  wrapper: HTMLElement,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  targetMode: "dark" | "light"
) {
  const isDark = targetMode === "dark";
  const bgColor = isDark ? "#09101d" : "#ffffff";
  const gridDot = isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.06)";

  // 1. Background Fill & Grid Pattern
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = gridDot;
  for (let gx = 12; gx < width; gx += 24) {
    for (let gy = 12; gy < height; gy += 24) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Boundary Swimlanes (Group Boxes)
  const boundaryNodes = nodes.filter((n) => n.type === "boundaryNode" && !n.hidden);
  for (const n of boundaryNodes) {
    const el = wrapper.querySelector(`[data-id="${n.id}"]`) as HTMLElement;
    const data = n.data as BoundaryBoxData;
    const w = el ? el.offsetWidth : (data?.width || 1040);
    const h = el ? el.offsetHeight : (data?.height || 135);
    const x = n.position.x + offsetX;
    const y = n.position.y + offsetY;
    const cat = (data?.category || "ui") as ArchifyCategory;
    const styles = CATEGORY_STYLES[targetMode]?.[cat] || CATEGORY_STYLES[targetMode].ui;

    ctx.save();
    ctx.fillStyle = styles.laneBg || (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)");
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 12);
    else ctx.rect(x, y, w, h);
    ctx.fill();

    ctx.strokeStyle = styles.laneBorder || (isDark ? "rgba(255,255,255,0.14)" : "#cbd5e1");
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = styles.laneText || (isDark ? "#94a3b8" : "#64748b");
    ctx.fillText(data?.label || "", x + 16, y + 20);
    ctx.restore();
  }

  // 3. Vector Edges (Smooth Paths & Arrowheads)
  const edgePathEls = Array.from(wrapper.querySelectorAll("path.react-flow__edge-path")) as SVGPathElement[];
  for (const pathEl of edgePathEls) {
    const d = pathEl.getAttribute("d");
    if (!d) continue;

    const computed = window.getComputedStyle(pathEl);
    const strokeColor = computed.stroke || (isDark ? "#38bdf8" : "#0284c7");
    const strokeWidth = parseFloat(computed.strokeWidth) || 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    if (computed.strokeDasharray && computed.strokeDasharray !== "none") {
      const dashes = computed.strokeDasharray.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
      if (dashes.length > 0) ctx.setLineDash(dashes);
    }

    try {
      const p2d = new Path2D(d);
      ctx.stroke(p2d);
    } catch {}

    // Arrowhead marker at destination
    try {
      const totalLen = pathEl.getTotalLength();
      if (totalLen > 0) {
        const endPt = pathEl.getPointAtLength(totalLen);
        const prevPt = pathEl.getPointAtLength(Math.max(0, totalLen - 6));
        const angle = Math.atan2(endPt.y - prevPt.y, endPt.x - prevPt.x);

        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(endPt.x, endPt.y);
        ctx.lineTo(
          endPt.x - 11 * Math.cos(angle - Math.PI / 6),
          endPt.y - 11 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endPt.x - 11 * Math.cos(angle + Math.PI / 6),
          endPt.y - 11 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
    } catch {}

    ctx.restore();
  }

  // 4. Stage Nodes
  const stageNodes = nodes.filter((n) => n.type === "stageNode" && !n.hidden);
  for (const n of stageNodes) {
    const el = wrapper.querySelector(`[data-id="${n.id}"]`) as HTMLElement;
    const w = el ? el.offsetWidth : 120;
    const h = el ? el.offsetHeight : 28;
    const x = n.position.x + offsetX;
    const y = n.position.y + offsetY;

    ctx.save();
    ctx.fillStyle = isDark ? "#1e293b" : "#f1f5f9";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 99);
    else ctx.rect(x, y, w, h);
    ctx.fill();

    ctx.strokeStyle = isDark ? "#334155" : "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
    ctx.textAlign = "center";
    ctx.fillText((n.data as any)?.label || "", x + w / 2, y + h / 2 + 3.5);
    ctx.restore();
  }

  // 5. Archify Component Nodes
  const archifyNodes = nodes.filter((n) => n.type === "archifyNode" && !n.hidden);
  for (const n of archifyNodes) {
    const el = wrapper.querySelector(`[data-id="${n.id}"]`) as HTMLElement;
    const w = el ? el.offsetWidth : (n.measured?.width || 182);
    const h = el ? el.offsetHeight : (n.measured?.height || 64);
    const x = n.position.x + offsetX;
    const y = n.position.y + offsetY;

    const data = n.data as ArchifyCustomNodeData;
    const cat = data?.category || "ui";
    const styles = CATEGORY_STYLES[targetMode]?.[cat] || CATEGORY_STYLES[targetMode].ui;

    ctx.save();

    // Subtle glow / card shadow
    ctx.shadowColor = isDark ? styles.glow : "rgba(15, 23, 42, 0.08)";
    ctx.shadowBlur = isDark ? 14 : 8;
    ctx.shadowOffsetY = 3;

    // Card background
    ctx.fillStyle = styles.bg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10);
    else ctx.rect(x, y, w, h);
    ctx.fill();

    // Card border
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = data.isSelected ? (isDark ? "#ffffff" : styles.border) : styles.border;
    ctx.lineWidth = data.isSelected ? 2.5 : 1.5;
    ctx.stroke();

    // Left accent bar
    ctx.fillStyle = styles.border;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x + 2, y + 2, 4, h - 4, [6, 0, 0, 6]);
    else ctx.fillRect(x + 2, y + 2, 4, h - 4);
    ctx.fill();

    // Top Tag Badge (if present)
    if (data.tag) {
      ctx.font = "bold 9px 'JetBrains Mono', Consolas, monospace";
      const tagW = ctx.measureText(data.tag).width + 12;
      ctx.fillStyle = styles.bg;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x + 12, y - 9, tagW, 16, 4);
      else ctx.fillRect(x + 12, y - 9, tagW, 16);
      ctx.fill();

      ctx.strokeStyle = styles.border;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = styles.subtext;
      ctx.fillText(data.tag, x + 18, y + 3);
    }

    // Accent dot indicator
    ctx.fillStyle = styles.border;
    ctx.beginPath();
    ctx.arc(x + 18, y + 23, 4, 0, Math.PI * 2);
    ctx.fill();

    const maxTextW = w - 38;

    // Node Title (Label)
    ctx.font = "bold 12.5px 'JetBrains Mono', Consolas, monospace";
    ctx.fillStyle = styles.text;
    const labelText = fitCanvasText(ctx, data.label || "", maxTextW);
    ctx.fillText(labelText, x + 28, y + 27);

    // Subtitle (Role / Kind / Description)
    if (data.subtitle) {
      ctx.font = "10px 'JetBrains Mono', Consolas, monospace";
      ctx.fillStyle = styles.subtext;
      const subText = fitCanvasText(ctx, data.subtitle, maxTextW);
      ctx.fillText(subText, x + 28, y + 43);
    }

    // Extra Text (Evidence / Details)
    if (data.extraText) {
      ctx.font = "9px 'JetBrains Mono', Consolas, monospace";
      ctx.fillStyle = styles.subtext;
      ctx.globalAlpha = 0.85;
      const extra = fitCanvasText(ctx, data.extraText, maxTextW);
      ctx.fillText(extra, x + 28, y + 55);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // 6. Edge Labels
  const edgeLabelEls = Array.from(wrapper.querySelectorAll(".react-flow__edge-text, [class*='archify-edge-label'], .react-flow__edge-textwrapper")) as HTMLElement[];
  for (const lbl of edgeLabelEls) {
    const text = lbl.innerText?.trim();
    if (!text) continue;
    const rect = lbl.getBoundingClientRect();
    const vpEl = wrapper.querySelector(".react-flow__viewport");
    if (!vpEl) continue;
    const vpRect = vpEl.getBoundingClientRect();

    const lx = rect.left - vpRect.left + offsetX;
    const ly = rect.top - vpRect.top + offsetY;
    const lw = rect.width || 60;
    const lh = rect.height || 20;

    ctx.save();
    ctx.fillStyle = isDark ? "#091728" : "#ffffff";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(lx, ly, lw, lh, 6);
    else ctx.rect(lx, ly, lw, lh);
    ctx.fill();

    ctx.strokeStyle = isDark ? "#38bdf8" : "#cbd5e1";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = "bold 9.5px 'JetBrains Mono', Consolas, monospace";
    ctx.fillStyle = isDark ? "#7dd3fc" : "#0f172a";
    ctx.textAlign = "center";
    ctx.fillText(text, lx + lw / 2, ly + lh / 2 + 3.5);
    ctx.restore();
  }
}

// Generate Pure Vector SVG (100% vector, without foreignObject for perfect Figma / Adobe Illustrator compatibility)
function generatePureSvgString(
  nodes: FlowNode[],
  wrapper: HTMLElement,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  targetMode: "dark" | "light"
): string {
  const isDark = targetMode === "dark";
  const bgColor = isDark ? "#09101d" : "#ffffff";
  const gridDot = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  let svgElements = "";

  // 1. Boundaries
  const boundaryNodes = nodes.filter((n) => n.type === "boundaryNode" && !n.hidden);
  for (const n of boundaryNodes) {
    const el = wrapper.querySelector(`[data-id="${n.id}"]`) as HTMLElement;
    const data = n.data as BoundaryBoxData;
    const w = el ? el.offsetWidth : (data?.width || 1040);
    const h = el ? el.offsetHeight : (data?.height || 135);
    const x = n.position.x + offsetX;
    const y = n.position.y + offsetY;
    const cat = (data?.category || "ui") as ArchifyCategory;
    const styles = CATEGORY_STYLES[targetMode]?.[cat] || CATEGORY_STYLES[targetMode].ui;
    svgElements += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${styles.laneBg || (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)")}" stroke="${styles.laneBorder || (isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1")}" stroke-dasharray="4 4" stroke-width="1" />\n`;
    svgElements += `<text x="${x + 16}" y="${y + 20}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" fill="${styles.laneText || (isDark ? "#94a3b8" : "#64748b")}">${escapeXml(data?.label || "")}</text>\n`;
  }

  // 2. Edges
  const edgePathEls = Array.from(wrapper.querySelectorAll("path.react-flow__edge-path")) as SVGPathElement[];
  for (const pathEl of edgePathEls) {
    const d = pathEl.getAttribute("d");
    if (!d) continue;
    const computed = window.getComputedStyle(pathEl);
    const stroke = computed.stroke || (isDark ? "#38bdf8" : "#0284c7");
    const strokeWidth = computed.strokeWidth || "2";
    const strokeDash = computed.strokeDasharray && computed.strokeDasharray !== "none" ? ` stroke-dasharray="${computed.strokeDasharray}"` : "";
    svgElements += `<g transform="translate(${offsetX}, ${offsetY})"><path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"${strokeDash} /></g>\n`;
  }

  // 3. Stage Nodes
  const stageNodes = nodes.filter((n) => n.type === "stageNode" && !n.hidden);
  for (const n of stageNodes) {
    const el = wrapper.querySelector(`[data-id="${n.id}"]`) as HTMLElement;
    const w = el ? el.offsetWidth : 120;
    const h = el ? el.offsetHeight : 28;
    const x = n.position.x + offsetX;
    const y = n.position.y + offsetY;
    svgElements += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${isDark ? "#1e293b" : "#f1f5f9"}" stroke="${isDark ? "#334155" : "#cbd5e1"}" stroke-width="1" />\n`;
    svgElements += `<text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="${isDark ? "#94a3b8" : "#64748b"}">${escapeXml((n.data as any)?.label || "")}</text>\n`;
  }

  // 4. Archify Component Nodes
  const archifyNodes = nodes.filter((n) => n.type === "archifyNode" && !n.hidden);
  for (const n of archifyNodes) {
    const el = wrapper.querySelector(`[data-id="${n.id}"]`) as HTMLElement;
    const w = el ? el.offsetWidth : (n.measured?.width || 182);
    const h = el ? el.offsetHeight : (n.measured?.height || 64);
    const x = n.position.x + offsetX;
    const y = n.position.y + offsetY;
    const data = n.data as ArchifyCustomNodeData;
    const cat = data?.category || "ui";
    const styles = CATEGORY_STYLES[targetMode]?.[cat] || CATEGORY_STYLES[targetMode].ui;

    svgElements += `<g id="node-${n.id}">\n`;
    svgElements += `  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${styles.bg}" stroke="${styles.border}" stroke-width="${data.isSelected ? 2.5 : 1.5}" />\n`;
    svgElements += `  <rect x="${x + 2}" y="${y + 2}" width="4" height="${h - 4}" rx="2" fill="${styles.border}" />\n`;
    if (data.tag) {
      const tagW = Math.max(36, data.tag.length * 6.5 + 12);
      svgElements += `  <rect x="${x + 12}" y="${y - 9}" width="${tagW}" height="16" rx="4" fill="${styles.bg}" stroke="${styles.border}" stroke-width="1" />\n`;
      svgElements += `  <text x="${x + 18}" y="${y + 3}" font-family="'JetBrains Mono', Consolas, monospace" font-size="9" font-weight="bold" fill="${styles.subtext}">${escapeXml(data.tag)}</text>\n`;
    }
    svgElements += `  <circle cx="${x + 18}" cy="${y + 23}" r="4" fill="${styles.border}" />\n`;
    svgElements += `  <text x="${x + 28}" y="${y + 27}" font-family="'JetBrains Mono', Consolas, monospace" font-size="12.5" font-weight="bold" fill="${styles.text}">${escapeXml(data.label || "")}</text>\n`;
    if (data.subtitle) {
      svgElements += `  <text x="${x + 28}" y="${y + 43}" font-family="'JetBrains Mono', Consolas, monospace" font-size="10" fill="${styles.subtext}">${escapeXml(data.subtitle)}</text>\n`;
    }
    if (data.extraText) {
      svgElements += `  <text x="${x + 28}" y="${y + 55}" font-family="'JetBrains Mono', Consolas, monospace" font-size="9" fill="${styles.subtext}" opacity="0.85">${escapeXml(data.extraText)}</text>\n`;
    }
    svgElements += `</g>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="repolens-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1" fill="${gridDot}" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="${bgColor}" />
  <rect width="100%" height="100%" fill="url(#repolens-grid)" />
  ${svgElements}
</svg>`;
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
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
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [dropdownAlign, setDropdownAlign] = useState<"right" | "left">("right");
  const { theme, toggleTheme } = useTheme();
  const { t, language } = useLanguage();

  // Selected Workflow Tab (defaults to "02-workflow" if kind is workflow, else "05-repo" if analysisId is provided)
  const [activeTab, setActiveTab] = useState<WorkflowPresetKey>(
    kind === "workflow" ? "02-workflow" : (analysisId ? "05-repo" : "repolens-arch")
  );

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

  // Semantic Lens: "all" | "ui" | "runtime" | "policy" | "data" | "cloud" | "bus" | "external"
  const [activeLens, setActiveLens] = useState<"all" | "ui" | "runtime" | "policy" | "data" | "cloud" | "bus" | "external">("all");

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

  // Label display mode: "auto" (default: only on hover/select) | "always" (all visible) | "hidden" (all hidden)
  const [labelDisplayMode, setLabelDisplayMode] = useState<"auto" | "always" | "hidden">("auto");

  // Simulate all system flows simultaneously
  const [isSimulateAllFlows, setIsSimulateAllFlows] = useState<boolean>(false);

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
      const targetDiagramType = kind === "dependencies"
        ? "dependencies"
        : (activeDiagramType === "default" ? undefined : activeDiagramType);

      analysisGateway
        .diagram(analysisId, targetDiagramType)
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
    } else if (activeTab === "repolens-arch") {
      const { nodes: builtNodes, edges: builtEdges } = buildRepoLensCleanArchitecture(theme);
      setNodes(builtNodes);
      setEdges(builtEdges);
      setRawGraph(null);
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.16, duration: 400 });
      }, 60);
    } else if (activeTab === "02-workflow") {
      if (analysisId) {
        setLoading(true);
        setError(null);

        analysisGateway
          .diagram(analysisId, "workflow")
          .then((diagram) => {
            setDiagramDto(diagram);
            if (diagram.status === "Success" && diagram.nodes && diagram.nodes.length > 0) {
              const { nodes: builtNodes, edges: builtEdges } = buildWorkflowFromDiagramDto(diagram, theme);
              setNodes(builtNodes);
              setEdges(builtEdges);
            } else {
              setNodes([]);
              setEdges([]);
            }
            setTimeout(() => {
              reactFlow.fitView({ padding: 0.14, duration: 400 });
            }, 60);
          })
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Unable to load workflow diagram.");
            setNodes([]);
            setEdges([]);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        const { nodes: builtNodes, edges: builtEdges } = buildReleaseDeliveryWorkflow(theme);
        setNodes(builtNodes);
        setEdges(builtEdges);
        setRawGraph(null);
        setTimeout(() => {
          reactFlow.fitView({ padding: 0.14, duration: 400 });
        }, 60);
      }
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

    return edges.map((e) => {
      const isIncoming = focusId !== null && e.target === focusId;
      const isOutgoing = focusId !== null && e.source === focusId;
      const isEdgeActive = activeEdgeIds.has(e.id) || e.id === selectedEdgeId;
      const isRouteEdge = routePathEdgeIds.has(e.id);
      const isDimmed = !isSimulateAllFlows && isAnySelected && !isEdgeActive && !isRouteEdge;

      // Pulse travels if active or if simulate all flows is turned on!
      const hasBeamPulse = isSimulateAllFlows || isEdgeActive || isRouteEdge;

      // Determine label visibility based on labelDisplayMode
      let showLabel = false;
      if (labelDisplayMode === "always" || isSimulateAllFlows) {
        showLabel = true;
      } else if (labelDisplayMode === "hidden") {
        showLabel = false;
      } else {
        // "auto": only show when edge is active (connected to hovered/selected node)
        showLabel = isEdgeActive || isRouteEdge;
      }

      // I/O tag: "IN" if flowing into the focused node, "OUT" if flowing out of the focused node
      const ioTag: "IN" | "OUT" | undefined = isIncoming ? "IN" : isOutgoing ? "OUT" : undefined;

      // Distinct vibrant colors for IN (sky blue) and OUT (emerald)
      let strokeColor: string;
      if (isRouteEdge) {
        strokeColor = "#ffbd2e";
      } else if (isIncoming) {
        strokeColor = theme === "dark" ? "#38bdf8" : "#0284c7"; // Distinct Sky Blue for INPUT
      } else if (isOutgoing) {
        strokeColor = theme === "dark" ? "#10b981" : "#059669"; // Distinct Emerald for OUTPUT
      } else if (isEdgeActive) {
        strokeColor = theme === "dark" ? "#00f0ff" : "#0d9488";
      } else if (isDimmed) {
        strokeColor = theme === "dark" ? "#1e293b" : "#cbd5e1";
      } else {
        strokeColor = (e.style?.stroke as string) || (theme === "dark" ? "#38bdf8" : "#0284c7");
      }

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
          filter: (isEdgeActive || isSimulateAllFlows) ? `drop-shadow(0 0 6px ${strokeColor})` : undefined,
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
          isEdgeActive,
          showLabel,
          ioTag,
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
  }, [edges, hoveredNodeId, selectedNodeId, selectedEdgeId, activeEdgeIds, routePathEdgeIds, isRouteProbing, activeLens, pulseCount, theme, labelDisplayMode, isSimulateAllFlows]);

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
    if (activeTab === "repolens-arch" || !analysisId) {
      window.open("/repolens-clean-architecture.html", "_blank");
      return;
    }
    const url = analysisGateway.exportArchifyHtmlUrl(analysisId, theme);
    window.open(url, "_blank");
  };

  const isDark = theme === "dark";

  // Create high-fidelity snapshot (SVG + Canvas) from the live diagram
  const createDiagramSnapshot = useCallback(
    async (options: {
      targetTheme?: "light" | "dark" | "auto";
      scale?: number;
    }): Promise<{
      svgString: string;
      width: number;
      height: number;
      canvas: HTMLCanvasElement;
    } | null> => {
      const wrapper = reactFlowWrapperRef.current;
      if (!wrapper) return null;

      const viewportEl = wrapper.querySelector(".react-flow__viewport") as HTMLElement;
      if (!viewportEl) return null;

      const currentNodes = reactFlow.getNodes();
      const validNodes = currentNodes.filter((n) => !n.hidden);

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      if (validNodes.length === 0) {
        minX = 0;
        minY = 0;
        maxX = 1200;
        maxY = 800;
      } else {
        for (const n of validNodes) {
          const el = wrapper.querySelector(`[data-id="${n.id}"]`) as HTMLElement;
          const w = el ? el.offsetWidth : (n.measured?.width || (n.style?.width as number) || 240);
          const h = el ? el.offsetHeight : (n.measured?.height || (n.style?.height as number) || 120);
          const x = n.position.x;
          const y = n.position.y;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x + w > maxX) maxX = x + w;
          if (y + h > maxY) maxY = y + h;
        }
      }

      const padding = 60;
      const width = Math.max(800, Math.ceil(maxX - minX + padding * 2));
      const height = Math.max(600, Math.ceil(maxY - minY + padding * 2));
      const offsetX = -minX + padding;
      const offsetY = -minY + padding;

      const targetMode =
        options.targetTheme === "light"
          ? "light"
          : options.targetTheme === "dark"
          ? "dark"
          : isDark
          ? "dark"
          : "light";

      const scale = options.scale || 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");

      if (!ctx) return null;

      ctx.scale(scale, scale);

      // Direct Canvas 2D drawing (completely eliminates foreignObject canvas tainting)
      drawDiagramToCanvas(ctx, validNodes, wrapper, width, height, offsetX, offsetY, targetMode);

      // Pure vector SVG (without foreignObject for seamless export)
      const svgString = generatePureSvgString(validNodes, wrapper, width, height, offsetX, offsetY, targetMode);

      return { svgString, width, height, canvas };
    },
    [isDark, reactFlow],
  );

  // Unified Export Dispatcher for all 8 formats
  const handleExport = useCallback(
    async (format: "copy" | "png" | "jpeg" | "webp" | "svg-auto" | "svg-light" | "svg-dark" | "webm") => {
      setIsExporting(true);
      setIsExportOpen(false);

      const baseName = analysisId ? `repo-${analysisId}-architecture` : "repolens-clean-architecture";

      try {
        if (format === "svg-auto" || format === "svg-light" || format === "svg-dark") {
          const targetTheme = format === "svg-light" ? "light" : format === "svg-dark" ? "dark" : "auto";
          const snapshot = await createDiagramSnapshot({ targetTheme, scale: 2 });
          if (!snapshot) throw new Error("Could not capture diagram SVG");

          const blob = new Blob([snapshot.svgString], { type: "image/svg+xml;charset=utf-8" });
          const suffix = format === "svg-light" ? "-light" : format === "svg-dark" ? "-dark" : "";
          downloadBlob(blob, `${baseName}${suffix}.svg`);
          setExportToast(
            format === "svg-light"
              ? "Exported SVG (Light theme)"
              : format === "svg-dark"
              ? "Exported SVG (Dark theme)"
              : "Exported SVG (Auto theme)"
          );
          return;
        }

        if (format === "webm") {
          setExportToast("Recording 6s motion video...");
          const snapshot = await createDiagramSnapshot({ scale: 2 });
          if (!snapshot) throw new Error("Could not capture diagram for WebM");

          const webmBlob = await recordWebMMotion(snapshot.canvas);
          downloadBlob(webmBlob, `${baseName}-motion.webm`);
          setExportToast("Exported 6s WebM motion video!");
          return;
        }

        // Raster image formats (copy, png, jpeg, webp)
        const snapshot = await createDiagramSnapshot({ scale: 2 });
        if (!snapshot) throw new Error("Could not capture diagram canvas");

        if (format === "copy") {
          snapshot.canvas.toBlob(async (blob) => {
            if (!blob) return;
            try {
              if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                setExportToast("Copied diagram PNG to clipboard!");
              } else {
                downloadBlob(blob, `${baseName}.png`);
                setExportToast("Diagram downloaded as PNG");
              }
            } catch {
              downloadBlob(blob, `${baseName}.png`);
              setExportToast("Diagram downloaded as PNG");
            }
          }, "image/png");
          return;
        }

        if (format === "png") {
          snapshot.canvas.toBlob((blob) => {
            if (blob) downloadBlob(blob, `${baseName}.png`);
            setExportToast("Exported PNG successfully!");
          }, "image/png");
          return;
        }

        if (format === "jpeg") {
          snapshot.canvas.toBlob((blob) => {
            if (blob) downloadBlob(blob, `${baseName}.jpg`);
            setExportToast("Exported JPEG successfully!");
          }, "image/jpeg", 0.92);
          return;
        }

        if (format === "webp") {
          snapshot.canvas.toBlob((blob) => {
            if (blob) downloadBlob(blob, `${baseName}.webp`);
            setExportToast("Exported WebP successfully!");
          }, "image/webp", 0.95);
          return;
        }
      } catch (err) {
        console.error("Export diagram failed:", err);
        setExportToast("Failed to export diagram. Please try again.");
      } finally {
        setIsExporting(false);
      }
    },
    [analysisId, createDiagramSnapshot],
  );

  // Keyboard shortcut: E toggles Export dropdown, Escape closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl as HTMLElement).isContentEditable);
      if (isInput) return;

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setIsExportOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsExportOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };

    if (isExportOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExportOpen]);

  // Auto-dismiss export toast
  useEffect(() => {
    if (exportToast) {
      const timer = setTimeout(() => {
        setExportToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [exportToast]);

  // Dynamic dropdown alignment to avoid being clipped by container overflow or screen edge
  useEffect(() => {
    if (isExportOpen && exportMenuRef.current) {
      const rect = exportMenuRef.current.getBoundingClientRect();
      if (rect.left < 315) {
        setDropdownAlign("left");
      } else {
        setDropdownAlign("right");
      }
    }
  }, [isExportOpen]);

  const isDependenciesView = kind === "dependencies";

  // Tab definitions: strictly show only repository architecture/dependencies when viewing an analyzed repo
  const tabs: { key: WorkflowPresetKey; label: string; file: string }[] = [];
  if (analysisId) {
    tabs.push({
      key: "05-repo",
      label: isDependenciesView
        ? (language === "vi" ? "Sơ đồ Phụ thuộc" : "Dependencies Graph")
        : (language === "vi" ? "Kiến trúc Hệ thống" : "Live Architecture"),
      file: isDependenciesView
        ? `repo-${analysisId}.dependencies.html`
        : `repo-${analysisId}.architecture.html`,
    });
    tabs.push({
      key: "repolens-arch",
      label: language === "vi" ? "01 Kiến trúc Chuẩn (Clean Arch)" : "01 Clean Architecture SRS",
      file: "repolens-clean-architecture.html",
    });
    tabs.push({
      key: "02-workflow",
      label: language === "vi" ? "02 Quy trình Phát hành (Workflow)" : "02 Release Delivery Workflow",
      file: "release-delivery-workflow.html",
    });
  } else {
    tabs.push(
      { key: "repolens-arch", label: "01 Clean Architecture SRS", file: "repolens-clean-architecture.html" },
      { key: "02-workflow", label: "02 Release Delivery Workflow", file: "release-delivery-workflow.html" },
      { key: "01-agent", label: "03 Agent Tool Call", file: "agent-tool-call.workflow.html" },
    );
  }

  const currentTabInfo = tabs.find((t) => t.key === activeTab) || tabs[0];

  return (
    <div
      ref={workspaceRef}
      style={{
        width: "100%",
        minHeight: isFullscreen ? "100vh" : "800px",
        background: "transparent",
        color: isDark ? "#f8fafc" : "#0f172a",
        padding: isFullscreen ? "0" : "12px 0 48px",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Space Mono', Consolas, monospace",
        transition: "color 0.3s ease",
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
                          ? `1px solid ${isDark ? "rgba(0, 245, 212, 0.5)" : "rgba(11, 143, 104, 0.45)"}`
                          : "1px solid transparent",
                        cursor: "pointer",
                        background: isActive
                          ? isDark
                            ? "rgba(0, 245, 212, 0.14)"
                            : "#e6f7f0"
                          : "transparent",
                        color: isActive
                          ? isDark
                            ? "#00f5d4"
                            : "#065e44"
                          : isDark
                            ? "#94a3b8"
                            : "#64748b",
                        transition: "all 0.18s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {tab.key === "05-repo" && (
                        isDependenciesView ? (
                          <PackageIcon size={13} color="currentColor" />
                        ) : (
                          <ArchitectureIcon size={13} color="currentColor" />
                        )
                      )}
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
                        gap: "6px",
                      }}
                    >
                      <PackageIcon size={13} color="currentColor" />
                      <span>{classification.type}</span>
                      <span style={{ fontSize: "9.5px", opacity: 0.85 }}>({classification.confidence})</span>
                    </div>
                  )}

                  {!isDependenciesView && availableDiagramTypes.length > 1 && (
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
                                    ? "rgba(0, 245, 212, 0.5)"
                                    : "rgba(11, 143, 104, 0.45)"
                                  : isDark
                                  ? "#334155"
                                  : "#cbd5e1"
                              }`,
                              background: isCurActive
                                ? isDark
                                  ? "rgba(0, 245, 212, 0.14)"
                                  : "#e6f7f0"
                                : "transparent",
                              color: isCurActive
                                ? isDark
                                  ? "#00f5d4"
                                  : "#065e44"
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
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end", marginLeft: "auto" }}>
              {/* Trace Motion Toggle */}
              <button
                type="button"
                onClick={() => setIsTraceMotion(!isTraceMotion)}
                title="Toggle signal flow animation"
                style={{
                  padding: "5px 10px",
                  borderRadius: "7px",
                  border: `1px solid ${isTraceMotion ? (isDark ? "rgba(0, 245, 212, 0.45)" : "rgba(11, 143, 104, 0.45)") : isDark ? "#334155" : "#cbd5e1"}`,
                  background: isTraceMotion ? (isDark ? "rgba(0, 245, 212, 0.14)" : "#e6f7f0") : "transparent",
                  color: isTraceMotion ? (isDark ? "#00f5d4" : "#065e44") : isDark ? "#94a3b8" : "#64748b",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <BoltIcon size={12} color={isTraceMotion ? (isDark ? "#00f5d4" : "#065e44") : "currentColor"} />
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
                  border: `1px solid ${isDark ? "rgba(0, 245, 212, 0.3)" : "#cbd5e1"}`,
                  background: isDark ? "rgba(0, 245, 212, 0.1)" : "#f1f5f9",
                  color: isDark ? "#00f5d4" : "#065e44",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {isDark ? <SunIcon size={12} color="#f59e0b" /> : <MoonIcon size={12} color="#065e44" />}
                <span>{isDark ? "Light" : "Dark"}</span>
              </button>

              {/* Standalone HTML Export */}
              {(analysisId || activeTab === "repolens-arch") && (
                <button
                  type="button"
                  onClick={exportStandaloneHtml}
                  title="Export portable standalone HTML report"
                  style={{
                    padding: "5px 11px",
                    borderRadius: "7px",
                    border: `1px solid ${isDark ? "rgba(0, 245, 212, 0.45)" : "rgba(11, 143, 104, 0.45)"}`,
                    background: isDark ? "rgba(0, 245, 212, 0.14)" : "#e6f7f0",
                    color: isDark ? "#00f5d4" : "#065e44",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>Export HTML</span>
                  <ExternalLinkIcon size={11} color="currentColor" />
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

              {/* Label Display Mode Toggle */}
              <button
                type="button"
                onClick={() => {
                  setLabelDisplayMode((prev) =>
                    prev === "auto" ? "always" : prev === "always" ? "hidden" : "auto",
                  );
                }}
                title={
                  language === "vi"
                    ? `Chế độ hiển thị nhãn dán: ${
                        labelDisplayMode === "auto"
                          ? "Tự động (Hiện khi rê chuột/chọn)"
                          : labelDisplayMode === "always"
                          ? "Luôn hiện tất cả"
                          : "Ẩn tất cả"
                      }. Bấm để chuyển đổi.`
                    : `Label mode: ${labelDisplayMode}. Click to toggle.`
                }
                style={{
                  padding: "5px 10px",
                  borderRadius: "7px",
                  border: `1px solid ${
                    labelDisplayMode === "always"
                      ? (isDark ? "rgba(0, 245, 212, 0.5)" : "#0b8f68")
                      : labelDisplayMode === "hidden"
                      ? (isDark ? "#475569" : "#94a3b8")
                      : (isDark ? "#334155" : "#cbd5e1")
                  }`,
                  background:
                    labelDisplayMode === "always"
                      ? (isDark ? "rgba(0, 245, 212, 0.14)" : "#e6f7f0")
                      : "transparent",
                  color:
                    labelDisplayMode === "always"
                      ? (isDark ? "#00f5d4" : "#065e44")
                      : (isDark ? "#94a3b8" : "#64748b"),
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <TagIcon size={12} color="currentColor" />
                <span>
                  {labelDisplayMode === "auto"
                    ? (language === "vi" ? "Nhãn: Tự động" : "Labels: Auto")
                    : labelDisplayMode === "always"
                    ? (language === "vi" ? "Nhãn: Luôn hiện" : "Labels: All")
                    : (language === "vi" ? "Nhãn: Ẩn" : "Labels: Off")}
                </span>
              </button>

              {/* Simulate All Flows Toggle */}
              <button
                type="button"
                onClick={() => setIsSimulateAllFlows(!isSimulateAllFlows)}
                title={
                  language === "vi"
                    ? isSimulateAllFlows
                      ? "Đang chạy luồng toàn hệ thống. Bấm để dừng."
                      : "Bấm để chạy mô phỏng toàn bộ luồng dữ liệu của hệ thống"
                    : "Simulate all system flows"
                }
                style={{
                  padding: "5px 10px",
                  borderRadius: "7px",
                  border: `1px solid ${
                    isSimulateAllFlows
                      ? (isDark ? "#00f0ff" : "#0284c7")
                      : (isDark ? "#334155" : "#cbd5e1")
                  }`,
                  background: isSimulateAllFlows
                    ? (isDark ? "rgba(0, 240, 255, 0.18)" : "#e0f2fe")
                    : "transparent",
                  color: isSimulateAllFlows
                    ? (isDark ? "#00f0ff" : "#0284c7")
                    : (isDark ? "#94a3b8" : "#64748b"),
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <BoltIcon size={12} color={isSimulateAllFlows ? (isDark ? "#00f0ff" : "#0284c7") : "currentColor"} />
                <span>
                  {isSimulateAllFlows
                    ? (language === "vi" ? "Đang chạy luồng" : "Flowing...")
                    : (language === "vi" ? "Chạy toàn luồng" : "Run All Flows")}
                </span>
              </button>

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
                <span>{isViewLocked ? (language === "vi" ? "Cố định" : "Locked") : (language === "vi" ? "Tự do" : "Unlocked")}</span>
              </button>

              {/* Inspector HUD Toggle Button */}
              <button
                type="button"
                onClick={() => setIsHudOpen(!isHudOpen)}
                title={language === "vi" ? "Bật / tắt bảng thông số chi tiết" : "Toggle inspector HUD panel"}
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
                <span>{language === "vi" ? "Chi tiết" : "Inspector"}</span>
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

              {/* Export Diagram Dropdown */}
              <div ref={exportMenuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setIsExportOpen((prev) => !prev)}
                  title="Export diagram (Shortcut: E)"
                  style={{
                    padding: "5px 12px",
                    borderRadius: "8px",
                    background: isDark ? "#1e293b" : "#243247",
                    border: `1px solid ${isDark ? "#334155" : "#1e293b"}`,
                    color: "#f8fafc",
                    fontSize: "12px",
                    fontWeight: 650,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>Export</span>
                  {isExportOpen ? (
                    <ChevronUpIcon size={12} color="#94a3b8" />
                  ) : (
                    <ChevronDownIcon size={12} color="#94a3b8" />
                  )}
                </button>

                {/* Dropdown Menu Modal */}
                {isExportOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      ...(dropdownAlign === "left" ? { left: 0 } : { right: 0 }),
                      width: "295px",
                      maxWidth: "calc(100vw - 36px)",
                      background: isDark ? "#0f172a" : "#ffffff",
                      borderRadius: "16px",
                      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                      boxShadow: isDark
                        ? "0 20px 45px -10px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06)"
                        : "0 20px 40px -8px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)",
                      padding: "16px 14px 14px 14px",
                      zIndex: 500,
                      fontFamily: "var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
                      letterSpacing: "normal",
                      boxSizing: "border-box",
                      animation: "fadeIn 0.15s ease-out",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: isDark ? "#f8fafc" : "#0f172a", letterSpacing: "-0.2px" }}>
                        Export diagram
                      </div>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 600,
                          color: isDark ? "#94a3b8" : "#64748b",
                          border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                          borderRadius: "5px",
                          padding: "1px 6px",
                          lineHeight: "1.3",
                        }}
                      >
                        E
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "10px" }}>
                      Portable, clean outputs
                    </div>

                    {/* SECTION: SHARE */}
                    <div style={{ fontSize: "10.5px", fontWeight: 700, color: isDark ? "#64748b" : "#94a3b8", textTransform: "none", marginBottom: "4px", paddingLeft: "6px" }}>
                      Share
                    </div>
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => handleExport("copy")}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        background: "transparent",
                        border: "none",
                        cursor: isExporting ? "wait" : "pointer",
                        transition: "background 0.15s ease",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <ExportCopyIcon size={15} color={isDark ? "#94a3b8" : "#64748b"} />
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: isDark ? "#f1f5f9" : "#1e293b", whiteSpace: "nowrap" }}>
                          Copy diagram
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "8px" }}>
                        PNG to clipboard
                      </span>
                    </button>

                    {/* DIVIDER */}
                    <div style={{ height: "1px", background: isDark ? "#1e293b" : "#f1f5f9", margin: "8px 0" }} />

                    {/* SECTION: IMAGE */}
                    <div style={{ fontSize: "10.5px", fontWeight: 700, color: isDark ? "#64748b" : "#94a3b8", textTransform: "none", marginBottom: "4px", paddingLeft: "6px" }}>
                      Image
                    </div>
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => handleExport("png")}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        background: "transparent",
                        border: "none",
                        cursor: isExporting ? "wait" : "pointer",
                        transition: "background 0.15s ease",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <ExportImageIcon size={15} color={isDark ? "#94a3b8" : "#64748b"} />
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: isDark ? "#f1f5f9" : "#1e293b", whiteSpace: "nowrap" }}>
                          PNG
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "8px" }}>
                        Lossless image
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => handleExport("jpeg")}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        background: "transparent",
                        border: "none",
                        cursor: isExporting ? "wait" : "pointer",
                        transition: "background 0.15s ease",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <ExportImageIcon size={15} color={isDark ? "#94a3b8" : "#64748b"} />
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: isDark ? "#f1f5f9" : "#1e293b", whiteSpace: "nowrap" }}>
                          JPEG
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "8px" }}>
                        Compact image
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => handleExport("webp")}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        background: "transparent",
                        border: "none",
                        cursor: isExporting ? "wait" : "pointer",
                        transition: "background 0.15s ease",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <ExportImageIcon size={15} color={isDark ? "#94a3b8" : "#64748b"} />
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: isDark ? "#f1f5f9" : "#1e293b", whiteSpace: "nowrap" }}>
                          WebP
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "8px" }}>
                        Modern image
                      </span>
                    </button>

                    {/* DIVIDER */}
                    <div style={{ height: "1px", background: isDark ? "#1e293b" : "#f1f5f9", margin: "8px 0" }} />

                    {/* SECTION: VECTOR & MOTION */}
                    <div style={{ fontSize: "10.5px", fontWeight: 700, color: isDark ? "#64748b" : "#94a3b8", textTransform: "none", marginBottom: "4px", paddingLeft: "6px" }}>
                      Vector & motion
                    </div>
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => handleExport("svg-auto")}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        background: "transparent",
                        border: "none",
                        cursor: isExporting ? "wait" : "pointer",
                        transition: "background 0.15s ease",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <ExportCubeIcon size={15} color={isDark ? "#94a3b8" : "#64748b"} />
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: isDark ? "#f1f5f9" : "#1e293b", whiteSpace: "nowrap" }}>
                          SVG · Auto
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "8px" }}>
                        Matches host theme
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => handleExport("svg-light")}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        background: "transparent",
                        border: "none",
                        cursor: isExporting ? "wait" : "pointer",
                        transition: "background 0.15s ease",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <ExportCubeIcon size={15} color={isDark ? "#94a3b8" : "#64748b"} />
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: isDark ? "#f1f5f9" : "#1e293b", whiteSpace: "nowrap" }}>
                          SVG · Light
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "8px" }}>
                        Always light
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => handleExport("svg-dark")}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        background: "transparent",
                        border: "none",
                        cursor: isExporting ? "wait" : "pointer",
                        transition: "background 0.15s ease",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <ExportCubeIcon size={15} color={isDark ? "#94a3b8" : "#64748b"} />
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: isDark ? "#f1f5f9" : "#1e293b", whiteSpace: "nowrap" }}>
                          SVG · Dark
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "8px" }}>
                        Always dark
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => handleExport("webm")}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        background: "transparent",
                        border: "none",
                        cursor: isExporting ? "wait" : "pointer",
                        transition: "background 0.15s ease",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <ExportCubeIcon size={15} color={isDark ? "#94a3b8" : "#64748b"} />
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: isDark ? "#f1f5f9" : "#1e293b", whiteSpace: "nowrap" }}>
                          WebM
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "8px" }}>
                        6s motion
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div ref={reactFlowWrapperRef} style={{ height: isFullscreen ? "calc(100vh - 92px)" : "660px", position: "relative" }}>
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

              <Controls
                showInteractive={!isViewLocked}
                className={isDark ? "archify-controls-dark" : "archify-controls-light"}
                style={{
                  bottom: isHudOpen ? 18 : 60,
                  left: isHudOpen ? 376 : 16,
                  transition: "bottom 0.25s ease, left 0.25s ease",
                  zIndex: 25,
                }}
              />
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
                  backdropFilter: "blur(5px)",
                  background: isDark ? "rgba(9, 16, 29, 0.72)" : "rgba(241, 245, 249, 0.55)",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    maxWidth: 460,
                    width: "92%",
                    padding: "32px 28px",
                    borderRadius: "16px",
                    background: isDark ? "#09141f" : "#ffffff",
                    border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
                    borderTop: isDark ? "3px solid #00f5d4" : "3px solid #0b8f68",
                    boxShadow: isDark
                      ? "0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 25px rgba(0, 245, 212, 0.1)"
                      : "0 20px 45px -10px rgba(11, 143, 104, 0.1), 0 0 0 1px rgba(15, 23, 42, 0.04)",
                    textAlign: "center",
                  }}
                >
                  {/* Engineering Status Pill */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      fontFamily: "'JetBrains Mono', Consolas, monospace",
                      background: isDark ? "rgba(0, 245, 212, 0.12)" : "#e6f7f0",
                      color: isDark ? "#00f5d4" : "#065e44",
                      border: `1px solid ${isDark ? "rgba(0, 245, 212, 0.3)" : "rgba(11, 143, 104, 0.28)"}`,
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: isDark ? "#00f5d4" : "#0b8f68" }} />
                    <span>{t("diagram.statusBadge")}</span>
                  </div>

                  {/* Icon Badge */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      margin: "0 auto 16px",
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDark ? "rgba(0, 245, 212, 0.1)" : "#e6f7f0",
                      border: `1px solid ${isDark ? "rgba(0, 245, 212, 0.25)" : "rgba(11, 143, 104, 0.25)"}`,
                      color: isDark ? "#00f5d4" : "#0b8f68",
                    }}
                  >
                    {diagramDto.status === "NotDetected" ? (
                      <SearchIcon size={22} color="currentColor" />
                    ) : (
                      <AlertTriangleIcon size={22} color="currentColor" />
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      margin: "0 0 10px",
                      fontSize: "16px",
                      fontWeight: 750,
                      color: isDark ? "#f8fafc" : "#0f172a",
                      fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {diagramDto.status === "NotDetected"
                      ? t("diagram.notDetectedTitle")
                      : t("diagram.unsupportedTitle")}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      margin: "0 auto 22px",
                      maxWidth: 380,
                      fontSize: "12px",
                      color: isDark ? "#94a3b8" : "#64748b",
                      lineHeight: 1.6,
                      fontFamily: "'JetBrains Mono', Consolas, monospace",
                    }}
                  >
                    {(() => {
                      if (language === "en") {
                        if (
                          diagramDto.message &&
                          (diagramDto.message.toLowerCase().includes("database") ||
                            diagramDto.message.toLowerCase().includes("dbcontext"))
                        ) {
                          return t("diagram.noDatabaseDesc");
                        }
                        return diagramDto.status === "NotDetected"
                          ? t("diagram.notDetectedDefaultDesc")
                          : t("diagram.unsupportedDesc");
                      }
                      return (
                        diagramDto.message ||
                        (diagramDto.status === "NotDetected"
                          ? t("diagram.notDetectedDefaultDesc")
                          : t("diagram.unsupportedDesc"))
                      );
                    })()}
                  </p>

                  {/* Back to main diagram button */}
                  {availableDiagramTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDiagramType(availableDiagramTypes[0]);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        padding: "9px 20px",
                        borderRadius: "10px",
                        border: "none",
                        background: isDark
                          ? "linear-gradient(135deg, #00f5d4 0%, #00d2b4 100%)"
                          : "linear-gradient(135deg, #0e8561 0%, #066045 100%)",
                        color: isDark ? "#041410" : "#ffffff",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: isDark
                          ? "0 4px 18px rgba(0, 245, 212, 0.35)"
                          : "0 4px 16px rgba(11, 143, 104, 0.28)",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <ArrowLeftIcon size={12} color="currentColor" />
                      <span>{t("diagram.backToMain")}</span>
                      <span style={{ opacity: 0.9, textTransform: "capitalize" }}>({availableDiagramTypes[0]})</span>
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
                title={language === "vi" ? "Mở bảng thông số và công cụ chi tiết" : "Open details & tools inspector panel"}
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  padding: "6px 14px",
                  borderRadius: "20px",
                  background: isDark ? "rgba(9, 16, 29, 0.9)" : "#ffffff",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${isDark ? "rgba(0, 245, 212, 0.4)" : "rgba(11, 143, 104, 0.4)"}`,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                  color: isDark ? "#00f5d4" : "#065e44",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  zIndex: 35,
                }}
              >
                <BoltIcon size={13} color={isDark ? "#00f5d4" : "#0b8f68"} />
                <span>{t("graph.detailsAndTools")}</span>
                <span style={{ fontSize: "10px", color: isDark ? "#94a3b8" : "#64748b" }}>({hudTab})</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "10px" }}>
                  <ChevronUpIcon size={11} color="currentColor" />
                  <span>{t("graph.open")}</span>
                </span>
              </button>
            )}

            {/* Floating Archify HUD Card (Collapsible, unblocking the diagram) */}
            {isHudOpen && (
              <aside
                style={{
                  position: "absolute",
                  bottom: 18,
                  left: 18,
                  width: "min(390px, calc(100vw - 36px))",
                  maxHeight: "calc(100% - 36px)",
                  overflowY: "auto",
                  overflowX: "hidden",
                  scrollbarWidth: "thin",
                  scrollbarColor: isDark ? "rgba(255, 255, 255, 0.16) transparent" : "rgba(0, 0, 0, 0.16) transparent",
                  background: isDark ? "rgba(9, 16, 29, 0.96)" : "rgba(255, 255, 255, 0.98)",
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                  borderRadius: "14px",
                  padding: "16px",
                  boxShadow: isDark
                    ? "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 245, 212, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.05)"
                    : "0 20px 45px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.04)",
                  zIndex: 40,
                  fontFamily: "var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
                }}
              >
                {/* HUD Header: Segmented Tabs + Collapse Button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    borderBottom: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                    paddingBottom: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      background: isDark ? "rgba(15, 23, 42, 0.75)" : "#f1f5f9",
                      padding: "3px",
                      borderRadius: "8px",
                      border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                    }}
                  >
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
                            background: isActive
                              ? isDark
                                ? "rgba(0, 245, 212, 0.15)"
                                : "#ffffff"
                              : "transparent",
                            border: isActive
                              ? `1px solid ${isDark ? "rgba(0, 245, 212, 0.35)" : "#cbd5e1"}`
                              : "1px solid transparent",
                            borderRadius: "6px",
                            color: isActive
                              ? isDark
                                ? "#00f5d4"
                                : "#0b8f68"
                              : isDark
                              ? "#94a3b8"
                              : "#64748b",
                            fontWeight: isActive ? 750 : 600,
                            fontSize: "11px",
                            letterSpacing: "0.04em",
                            cursor: "pointer",
                            padding: "4px 9px",
                            transition: "all 0.15s ease",
                            boxShadow: isActive && !isDark ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                          }}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>

                  {/* Close / Minimize Button */}
                  <button
                    type="button"
                    onClick={() => setIsHudOpen(false)}
                    title={language === "vi" ? "Thu gọn bảng này để nhìn toàn cảnh sơ đồ" : "Collapse inspector panel"}
                    style={{
                      background: isDark ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
                      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                      borderRadius: "7px",
                      color: isDark ? "#94a3b8" : "#64748b",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    <CloseIcon size={11} color="currentColor" />
                    <span>{language === "vi" ? "Thu gọn" : "Collapse"}</span>
                  </button>
                </div>

                {/* Status Header Badge */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 9px",
                    borderRadius: "6px",
                    background: isDark ? "rgba(0, 245, 212, 0.08)" : "#ecfdf5",
                    border: `1px solid ${isDark ? "rgba(0, 245, 212, 0.22)" : "#a7f3d0"}`,
                    color: isDark ? "#00f5d4" : "#065e44",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isDark ? "#00f5d4" : "#0b8f68",
                      boxShadow: isDark ? "0 0 8px #00f5d4" : "0 0 6px #0b8f68",
                    }}
                  />
                  <span>{loading ? (language === "vi" ? "ĐANG PHÂN TÍCH" : "ANALYZING") : "LIVE ARCHIFY"}</span>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontWeight: 700 }}>
                    {nodes.filter((n) => n.type === "archifyNode").length} {t("diagram.components").toUpperCase()} • {edges.length} {t("diagram.connections").toUpperCase()}
                  </span>
                </div>

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
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10.5px", fontWeight: 750, color: isDark ? "#00f5d4" : "#065e44", marginBottom: "6px" }}>
                        <BoltIcon size={12} color={isDark ? "#00f5d4" : "#0b8f68"} />
                        <span>{language === "vi" ? "Dò luồng đường đi (Route Probe)" : "Route Probe (Path Tracer)"}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "10.5px" }}>
                        <select
                          value={routeStartId || ""}
                          onChange={(e) => setRouteStartId(e.target.value || null)}
                          style={{ padding: "4px 8px", borderRadius: "5px", background: isDark ? "#091222" : "#ffffff", color: isDark ? "#f8fafc" : "#0f172a", border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}` }}
                        >
                          <option value="">{language === "vi" ? "Chọn điểm bắt đầu (A)..." : "Select Start Node (A)..."}</option>
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
                          <option value="">{language === "vi" ? "Chọn điểm đích (B)..." : "Select Target Node (B)..."}</option>
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
                            background: routeStartId && routeEndId
                              ? isDark
                                ? "linear-gradient(135deg, #00f5d4 0%, #00d2b4 100%)"
                                : "linear-gradient(135deg, #0e8561 0%, #066045 100%)"
                              : isDark
                              ? "#334155"
                              : "#cbd5e1",
                            color: routeStartId && routeEndId ? (isDark ? "#041410" : "#ffffff") : "#64748b",
                            cursor: routeStartId && routeEndId ? "pointer" : "not-allowed",
                            boxShadow: routeStartId && routeEndId ? (isDark ? "0 4px 14px rgba(0, 245, 212, 0.3)" : "0 4px 14px rgba(11, 143, 104, 0.25)") : "none",
                            transition: "all 0.18s ease",
                          }}
                        >
                          {language === "vi" ? "Dò luồng đường đi giữa A & B" : "Trace Path Between A & B"}
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
                        {/* Title & Category Badge */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", margin: "2px 0 6px" }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: "15px",
                                fontWeight: 700,
                                color: isDark ? "#f1f5f9" : "#0f172a",
                                lineHeight: 1.35,
                                wordBreak: "break-word",
                              }}
                            >
                              {selectedNodeData.detailCard?.title || selectedNodeData.label}
                            </h3>
                            {(() => {
                              const roleText = selectedNodeData.detailCard?.role || selectedNodeData.role || selectedNodeData.subtitle;
                              if (roleText && roleText.length <= 40 && roleText !== (selectedNodeData.detailCard?.title || selectedNodeData.label)) {
                                return (
                                  <div style={{ fontSize: "11px", color: isDark ? "#38bdf8" : "#0284c7", fontWeight: 600, marginTop: "2px" }}>
                                    {roleText}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          <span
                            style={{
                              flexShrink: 0,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "10px",
                              fontWeight: 750,
                              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                              letterSpacing: "0.04em",
                              background: isDark ? "rgba(0, 240, 255, 0.12)" : "#e0f2fe",
                              border: `1px solid ${isDark ? "rgba(0, 240, 255, 0.3)" : "#bae6fd"}`,
                              color: isDark ? "#38bdf8" : "#0284c7",
                              textTransform: "uppercase",
                            }}
                          >
                            {selectedNodeData.category || selectedNodeData.kind || "COMPONENT"}
                          </span>
                        </div>

                        {/* Metadata Chips: Symbol, Line Range / Verification Branches */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                          {selectedNodeData.detailCard?.symbol && (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: isDark ? "rgba(45, 212, 191, 0.1)" : "#f0fdf4",
                                border: `1px solid ${isDark ? "rgba(45, 212, 191, 0.25)" : "#bbf7d0"}`,
                                color: isDark ? "#2dd4bf" : "#15803d",
                                fontSize: "10px",
                                fontWeight: 650,
                                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                              }}
                            >
                              <span>Symbol: {selectedNodeData.detailCard.symbol}</span>
                            </div>
                          )}

                          {(selectedNodeData.detailCard?.lineRange || selectedNodeData.extraText) && (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                background: isDark ? "rgba(0, 245, 212, 0.08)" : "#ecfdf5",
                                border: `1px solid ${isDark ? "rgba(0, 245, 212, 0.25)" : "#a7f3d0"}`,
                                color: isDark ? "#00f5d4" : "#065e44",
                                fontSize: "10px",
                                fontWeight: 650,
                                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                              }}
                            >
                              <CodeNodeIcon size={10} color="currentColor" />
                              <span>{selectedNodeData.detailCard?.lineRange || selectedNodeData.extraText}</span>
                            </div>
                          )}
                        </div>

                        {/* File path + Explorer link */}
                        {(selectedNodeData.detailCard?.filePath || selectedNodeData.path) && (
                          <div
                            style={{
                              marginBottom: "10px",
                              padding: "6px 9px",
                              borderRadius: "6px",
                              background: isDark ? "rgba(15, 23, 42, 0.5)" : "#f8fafc",
                              border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "6px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                minWidth: 0,
                                fontSize: "10.5px",
                                color: isDark ? "#94a3b8" : "#64748b",
                                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                              }}
                              title={selectedNodeData.detailCard?.filePath || selectedNodeData.path}
                            >
                              <FolderIcon size={12} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {selectedNodeData.detailCard?.filePath || selectedNodeData.path}
                              </span>
                            </div>
                            {analysisId && !(selectedNodeData.detailCard?.filePath || selectedNodeData.path)?.startsWith("(") && (
                              <Link
                                href={`/projects/${analysisId}/files?path=${encodeURIComponent(selectedNodeData.detailCard?.filePath || selectedNodeData.path || "")}`}
                                title="View source file in Explorer"
                                style={{
                                  flexShrink: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontSize: "10.5px",
                                  color: isDark ? "#38bdf8" : "#0284c7",
                                  textDecoration: "none",
                                  fontWeight: 650,
                                }}
                              >
                                <span>Open</span>
                                <ExternalLinkIcon size={10} color="currentColor" />
                              </Link>
                            )}
                          </div>
                        )}

                        {/* Detail Description */}
                        {(selectedNodeData.detailCard?.description || selectedNodeData.detailCard?.summary) && (
                          <div
                            style={{
                              padding: "9px 11px",
                              borderRadius: "8px",
                              background: isDark ? "rgba(15, 23, 42, 0.6)" : "#f8fafc",
                              border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                              fontSize: "11.5px",
                              color: isDark ? "#cbd5e1" : "#334155",
                              lineHeight: 1.55,
                              marginBottom: "12px",
                            }}
                          >
                            {selectedNodeData.detailCard.description || selectedNodeData.detailCard.summary}
                          </div>
                        )}

                        {/* INPUT & OUTPUT DATA FLOW EXPLANATION CARD */}
                        {(() => {
                          const incomingList = edges.filter((e) => e.target === selectedNodeData.id);
                          const outgoingList = edges.filter((e) => e.source === selectedNodeData.id);

                          return (
                            <div
                              style={{
                                marginBottom: "12px",
                                padding: "10px 12px",
                                borderRadius: "9px",
                                background: isDark ? "rgba(15, 23, 42, 0.75)" : "#f8fafc",
                                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: "9px",
                                  paddingBottom: "7px",
                                  borderBottom: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                                }}
                              >
                                <span style={{ fontSize: "11px", fontWeight: 800, color: isDark ? "#00f5d4" : "#0b8f68", letterSpacing: "0.03em", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                  <ArchitectureIcon size={13} color="currentColor" />
                                  <span>{language === "vi" ? "LUỒNG DỮ LIỆU VÀO & RA" : "INPUT & OUTPUT FLOWS"}</span>
                                </span>
                                <span
                                  style={{
                                    fontSize: "9.5px",
                                    fontWeight: 750,
                                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                                    color: isDark ? "#94a3b8" : "#64748b",
                                    background: isDark ? "rgba(255, 255, 255, 0.05)" : "#e2e8f0",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {incomingList.length} IN • {outgoingList.length} OUT
                                </span>
                              </div>

                              {/* 1. INPUTS SECTION */}
                              <div style={{ marginBottom: "9px" }}>
                                <div style={{ fontSize: "10.5px", fontWeight: 700, color: isDark ? "#38bdf8" : "#0284c7", display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                                  <InputFlowIcon size={12} color="currentColor" />
                                  <span>{language === "vi" ? "Đầu vào (Nhận từ):" : "Inputs (Incoming):"}</span>
                                </div>
                                {incomingList.length > 0 ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                    {incomingList.map((e) => {
                                      const srcNode = nodes.find((n) => n.id === e.source);
                                      const srcLabel = (srcNode?.data as any)?.label || e.source;
                                      return (
                                        <div
                                          key={e.id}
                                          onClick={() => {
                                            if (srcNode) setSelectedNodeId(srcNode.id);
                                          }}
                                          title={language === "vi" ? `Bấm để xem ${srcLabel}` : `Click to inspect ${srcLabel}`}
                                          style={{
                                            fontSize: "11px",
                                            padding: "5px 8px",
                                            borderRadius: "6px",
                                            background: isDark ? "rgba(56, 189, 248, 0.08)" : "#f0f9ff",
                                            border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.22)" : "#bae6fd"}`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "8px",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                          }}
                                        >
                                          <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
                                            <span style={{ color: isDark ? "#38bdf8" : "#0284c7", fontSize: "10px" }}>←</span>
                                            <span style={{ color: isDark ? "#f1f5f9" : "#0f172a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                              {srcLabel}
                                            </span>
                                          </div>
                                          <span
                                            style={{
                                              flexShrink: 0,
                                              fontSize: "9.5px",
                                              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                                              fontWeight: 700,
                                              color: isDark ? "#38bdf8" : "#0284c7",
                                              background: isDark ? "rgba(56, 189, 248, 0.14)" : "#e0f2fe",
                                              padding: "2px 6px",
                                              borderRadius: "4px",
                                              border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.28)" : "#bae6fd"}`,
                                            }}
                                          >
                                            {e.label || (language === "vi" ? "yêu cầu" : "request")}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p style={{ margin: 0, fontSize: "10px", color: isDark ? "#64748b" : "#94a3b8", fontStyle: "italic", padding: "2px 4px" }}>
                                    {language === "vi" ? "• Điểm khởi phát (Không nhận luồng từ node nào)" : "• Entry point (No incoming inputs)"}
                                  </p>
                                )}
                              </div>

                              {/* 2. OUTPUTS SECTION */}
                              <div>
                                <div style={{ fontSize: "10.5px", fontWeight: 700, color: isDark ? "#34d399" : "#059669", display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                                  <OutputFlowIcon size={12} color="currentColor" />
                                  <span>{language === "vi" ? "Đầu ra (Chuyển tiếp tới):" : "Outputs (Outgoing):"}</span>
                                </div>
                                {outgoingList.length > 0 ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                    {outgoingList.map((e) => {
                                      const tgtNode = nodes.find((n) => n.id === e.target);
                                      const tgtLabel = (tgtNode?.data as any)?.label || e.target;
                                      return (
                                        <div
                                          key={e.id}
                                          onClick={() => {
                                            if (tgtNode) setSelectedNodeId(tgtNode.id);
                                          }}
                                          title={language === "vi" ? `Bấm để xem ${tgtLabel}` : `Click to inspect ${tgtLabel}`}
                                          style={{
                                            fontSize: "11px",
                                            padding: "5px 8px",
                                            borderRadius: "6px",
                                            background: isDark ? "rgba(16, 185, 129, 0.08)" : "#ecfdf5",
                                            border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.22)" : "#a7f3d0"}`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "8px",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                          }}
                                        >
                                          <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
                                            <span style={{ color: isDark ? "#34d399" : "#059669", fontSize: "10px" }}>→</span>
                                            <span style={{ color: isDark ? "#f1f5f9" : "#0f172a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                              {tgtLabel}
                                            </span>
                                          </div>
                                          <span
                                            style={{
                                              flexShrink: 0,
                                              fontSize: "9.5px",
                                              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                                              fontWeight: 700,
                                              color: isDark ? "#34d399" : "#059669",
                                              background: isDark ? "rgba(16, 185, 129, 0.14)" : "#d1fae5",
                                              padding: "2px 6px",
                                              borderRadius: "4px",
                                              border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.28)" : "#a7f3d0"}`,
                                            }}
                                          >
                                            {e.label || (language === "vi" ? "kết quả" : "output")}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p style={{ margin: 0, fontSize: "10px", color: isDark ? "#64748b" : "#94a3b8", fontStyle: "italic", padding: "2px 4px" }}>
                                    {language === "vi" ? "• Điểm kết thúc (Không chuyển tiếp ra node khác)" : "• Terminal leaf (No outgoing outputs)"}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })()}

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
                            <SearchIcon size={13} color="currentColor" />
                            <span>{language === "vi" ? "Mở sơ đồ chi tiết:" : "Open detailed diagram:"}</span>
                            <strong style={{ textTransform: "capitalize" }}>{selectedNodeData.childDiagramType}</strong>
                            <ArrowRightIcon size={11} color="currentColor" />
                          </button>
                        )}

                        {/* Direction Trace Buttons: Trace Reach */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                          <div style={{ fontSize: "10.5px", fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b" }}>
                            {language === "vi" ? "Trace Reach (Ảnh hưởng & Phụ thuộc):" : "Trace Reach (Impact & Dependencies):"}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() => setTraceDirection("upstream")}
                              title={language === "vi" ? "Xem các thành phần gọi đến hoặc phụ thuộc vào node này" : "Inspect components that call or depend on this node"}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                padding: "7px 10px",
                                fontSize: "11px",
                                fontWeight: 650,
                                borderRadius: "7px",
                                border: `1px solid ${traceDirection === "upstream" ? (isDark ? "#38bdf8" : "#0284c7") : isDark ? "rgba(56, 189, 248, 0.25)" : "#bae6fd"}`,
                                background: traceDirection === "upstream" ? (isDark ? "rgba(56, 189, 248, 0.25)" : "#bae6fd") : isDark ? "rgba(56, 189, 248, 0.08)" : "#f0f9ff",
                                color: isDark ? "#38bdf8" : "#0284c7",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <ArrowUpIcon size={12} />
                              <span>{language === "vi" ? "Ai gọi tới" : "Upstream"}</span>
                              {selectedNodeData.detailCard?.upstreamNodes && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                                    background: isDark ? "rgba(56, 189, 248, 0.2)" : "#e0f2fe",
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {selectedNodeData.detailCard.upstreamNodes.length}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setTraceDirection("downstream")}
                              title={language === "vi" ? "Xem các thành phần mà node này gọi đến hoặc phụ thuộc" : "Inspect downstream dependencies called by this node"}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                padding: "7px 10px",
                                fontSize: "11px",
                                fontWeight: 650,
                                borderRadius: "7px",
                                border: `1px solid ${traceDirection === "downstream" ? (isDark ? "#2dd4bf" : "#059669") : isDark ? "rgba(45, 212, 191, 0.25)" : "#a7f3d0"}`,
                                background: traceDirection === "downstream" ? (isDark ? "rgba(45, 212, 191, 0.25)" : "#a7f3d0") : isDark ? "rgba(45, 212, 191, 0.08)" : "#f0fdf4",
                                color: isDark ? "#2dd4bf" : "#059669",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <ArrowDownIcon size={12} />
                              <span>{language === "vi" ? "Phụ thuộc vào" : "Dependencies"}</span>
                              {selectedNodeData.detailCard?.downstreamNodes && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                                    background: isDark ? "rgba(45, 212, 191, 0.2)" : "#d1fae5",
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {selectedNodeData.detailCard.downstreamNodes.length}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Quick Route Probe Setters */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                          <button
                            type="button"
                            onClick={() => setRouteStartId(selectedNodeData.id)}
                            style={{
                              padding: "6px 8px",
                              fontSize: "10.5px",
                              fontWeight: 650,
                              borderRadius: "6px",
                              border: `1px solid ${routeStartId === selectedNodeData.id ? (isDark ? "#00f5d4" : "#0b8f68") : isDark ? "#334155" : "#cbd5e1"}`,
                              background: routeStartId === selectedNodeData.id ? (isDark ? "#00f5d4" : "#0b8f68") : isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                              color: routeStartId === selectedNodeData.id ? (isDark ? "#041410" : "#ffffff") : isDark ? "#94a3b8" : "#475569",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {language === "vi" ? "Đặt điểm đầu (A)" : "Set Route Start (A)"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRouteEndId(selectedNodeData.id)}
                            style={{
                              padding: "6px 8px",
                              fontSize: "10.5px",
                              fontWeight: 650,
                              borderRadius: "6px",
                              border: `1px solid ${routeEndId === selectedNodeData.id ? (isDark ? "#00f5d4" : "#0b8f68") : isDark ? "#334155" : "#cbd5e1"}`,
                              background: routeEndId === selectedNodeData.id ? (isDark ? "#00f5d4" : "#0b8f68") : isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                              color: routeEndId === selectedNodeData.id ? (isDark ? "#041410" : "#ffffff") : isDark ? "#94a3b8" : "#475569",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {language === "vi" ? "Đặt điểm đích (B)" : "Set Route End (B)"}
                          </button>
                        </div>

                        {/* Clear Focus Button */}
                        <button
                          type="button"
                          onClick={onPaneClick}
                          style={{
                            width: "100%",
                            marginTop: "8px",
                            padding: "6px",
                            fontSize: "10.5px",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                            background: isDark ? "rgba(255, 255, 255, 0.03)" : "#f8fafc",
                            color: isDark ? "#94a3b8" : "#64748b",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {language === "vi" ? "Bỏ toàn bộ tiêu điểm" : "Reset All Highlights"}
                        </button>
                      </>
                    ) : selectedEdgeData ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", margin: "2px 0 8px" }}>
                          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#38bdf8" }}>
                            {language === "vi" ? "Quan hệ:" : "Relationship:"} {selectedEdgeData.label || "Connected"}
                          </h3>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "9.5px",
                              fontFamily: "var(--font-mono, monospace)",
                              fontWeight: 700,
                              background: isDark ? "rgba(56, 189, 248, 0.12)" : "#e0f2fe",
                              color: isDark ? "#38bdf8" : "#0284c7",
                            }}
                          >
                            EDGE
                          </span>
                        </div>
                        <p style={{ margin: "0 0 10px", fontSize: "11.5px", color: isDark ? "#94a3b8" : "#475569", lineHeight: 1.5 }}>
                          From <strong style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>{selectedEdgeData.source}</strong> → To <strong style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>{selectedEdgeData.target}</strong>
                        </p>

                        {/* Evidence inspection */}
                        <div style={{ marginTop: "10px", padding: "9px 11px", borderRadius: "7px", background: isDark ? "rgba(15, 23, 42, 0.7)" : "#f1f5f9", border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}` }}>
                          <div style={{ fontSize: "10.5px", fontWeight: 700, color: isDark ? "#2dd4bf" : "#059669", marginBottom: "4px" }}>
                            ✓ Grounded Source Evidence
                          </div>
                          <div style={{ fontSize: "10px", color: isDark ? "#94a3b8" : "#64748b", fontFamily: "var(--font-mono, monospace)" }}>
                            Evidence ID: {(selectedEdgeData.data?.evidenceId as string) || "static analysis verified"}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={onPaneClick}
                          style={{
                            width: "100%",
                            marginTop: "10px",
                            padding: "6px",
                            fontSize: "10.5px",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                            background: "transparent",
                            color: isDark ? "#94a3b8" : "#64748b",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {language === "vi" ? "Bỏ chọn liên kết" : "Reset Edge Selection"}
                        </button>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b", lineHeight: 1.55 }}>
                        {language === "vi"
                          ? "Bấm vào bất kỳ thành phần hoặc đường liên kết nào trên sơ đồ để xem bằng chứng code và luồng tín hiệu chi tiết."
                          : "Click on any component or connection edge to view its grounded code evidence and signal flow."}
                      </p>
                    )}
                  </div>
                )}

                {/* Tab 3: TRACE / Route Probe Results */}
                {hudTab === "TRACE" && (
                  <div>
                    <h3 style={{ margin: "2px 0 6px", fontSize: "13.5px", fontWeight: 700, color: isRouteProbing ? "#ffbd2e" : isDark ? "#38bdf8" : "#0284c7" }}>
                      {isRouteProbing
                        ? (language === "vi" ? "Dò đường đi: Tuyến đường đang chọn" : "Route Probe: Active Path")
                        : (language === "vi" ? "Luồng tín hiệu: Dấu vết đang chạy" : "Signal Flow: Active Trace")}
                    </h3>

                    {isRouteProbing ? (
                      <div>
                        <p style={{ margin: "0 0 10px", fontSize: "11.5px", color: isDark ? "#94a3b8" : "#475569", lineHeight: 1.5 }}>
                          {language === "vi" ? "Đường đi ngắn nhất giữa " : "Highlighting shortest path between "}
                          <strong style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>{routeStartId}</strong>
                          {language === "vi" ? " và " : " and "}
                          <strong style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>{routeEndId}</strong>
                          {" "}({routePathNodeIds.size} {language === "vi" ? "thành phần" : "nodes"}, {routePathEdgeIds.size} {language === "vi" ? "liên kết" : "edges"}).
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
                            padding: "7px 10px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: "none",
                            background: isDark ? "#f43f5e" : "#e11d48",
                            color: "#ffffff",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {language === "vi" ? "Thoát chế độ dò đường" : "Exit Route Probe"}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ margin: "0 0 10px", fontSize: "11.5px", color: isDark ? "#94a3b8" : "#475569", lineHeight: 1.5 }}>
                          {activeNodeIds.size > 0
                            ? (language === "vi"
                                ? `Đang cô lập ${activeNodeIds.size} thành phần liên quan và ${activeEdgeIds.size} liên kết.`
                                : `Isolating ${activeNodeIds.size} connected nodes and ${activeEdgeIds.size} edges.`)
                            : (language === "vi"
                                ? "Chọn một thành phần để kiểm tra dấu vết tín hiệu kết nối."
                                : "Select a node to inspect its signal trace.")}
                        </p>
                        {selectedNodeId && (
                          <button
                            type="button"
                            onClick={onPaneClick}
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              borderRadius: "6px",
                              border: "none",
                              background: isDark ? "#f43f5e" : "#e11d48",
                              color: "#ffffff",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {language === "vi" ? "Xóa tiêu điểm truy vết" : "Clear Trace Focus"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: LENS (Interactive Architectural Layer Filter) */}
                {hudTab === "LENS" && (
                  <div>
                    <h3 style={{ margin: "2px 0 6px", fontSize: "13.5px", fontWeight: 700, color: isDark ? "#c084fc" : "#7c3aed" }}>
                      Semantic Architecture Lenses
                    </h3>
                    <p style={{ margin: "0 0 10px", fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>
                      {language === "vi" ? "Lọc thành phần theo vai trò kiến trúc:" : "Filter components by architectural responsibility:"}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      {[
                        { key: "all", label: "● ALL / Tất cả các tầng kiến trúc", color: isDark ? "#f8fafc" : "#0f172a" },
                        { key: "ui", label: "● Frontend / Client & Giao diện", color: isDark ? "#38bdf8" : "#0284c7" },
                        { key: "runtime", label: "● Backend / APIs & Dịch vụ", color: isDark ? "#2dd4bf" : "#059669" },
                        { key: "data", label: "● Database / Lưu trữ & CSDL", color: isDark ? "#c084fc" : "#7c3aed" },
                        { key: "cloud", label: "● Cloud / Hạ tầng & CDN", color: isDark ? "#fbbf24" : "#d97706" },
                        { key: "policy", label: "● Security / Xác thực & Bảo mật", color: isDark ? "#fb7185" : "#e11d48" },
                        { key: "bus", label: "● Message Bus / Hàng đợi & Sự kiện", color: isDark ? "#fb923c" : "#ea580c" },
                        { key: "external", label: "● External / Bên ngoài & Thứ 3", color: isDark ? "#94a3b8" : "#475569" },
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
                            padding: "7px 10px",
                            borderRadius: "6px",
                            border: activeLens === lens.key ? `1.5px solid ${lens.color}` : `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                            background: activeLens === lens.key ? (isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0") : isDark ? "rgba(255, 255, 255, 0.02)" : "transparent",
                            color: lens.color,
                            fontSize: "11px",
                            fontWeight: activeLens === lens.key ? 750 : 500,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
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
                {t("diagram.components")} •{" "}
                <strong style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{edges.length}</strong> {t("diagram.connections")}
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
                <span>{t("diagram.codeEvidence")}</span>
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
                <span>{t("diagram.inferredFlow")}</span>
              </span>

              {/* 7 Architecture Categories from Design System */}
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: isDark ? "#38bdf8" : "#0284c7" }} />
                <span>Frontend</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: isDark ? "#2dd4bf" : "#059669" }} />
                <span>Backend</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: isDark ? "#c084fc" : "#7c3aed" }} />
                <span>Database</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: isDark ? "#fbbf24" : "#d97706" }} />
                <span>Cloud</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: isDark ? "#fb7185" : "#e11d48" }} />
                <span>Security</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: isDark ? "#fb923c" : "#ea580c" }} />
                <span>Message Bus</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: isDark ? "#94a3b8" : "#475569" }} />
                <span>External</span>
              </span>
            </div>

            {/* Export Notification Toast */}
            {exportToast && (
              <div
                style={{
                  position: "absolute",
                  bottom: "24px",
                  right: "24px",
                  zIndex: 400,
                  padding: "10px 18px",
                  borderRadius: "10px",
                  background: isDark ? "#0f172a" : "#1e293b",
                  color: "#f8fafc",
                  fontSize: "12px",
                  fontWeight: 650,
                  border: `1px solid ${isDark ? "#334155" : "rgba(255,255,255,0.15)"}`,
                  boxShadow: "0 12px 28px -4px rgba(0,0,0,0.4), 0 4px 6px -2px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  animation: "fadeIn 0.2s ease-out",
                  pointerEvents: "none",
                }}
              >
                <span style={{ color: "#10b981", fontSize: "14px", fontWeight: 700 }}>✓</span>
                <span>{exportToast}</span>
              </div>
            )}
          </div>
        </div>

        {/* Compiler Contract, Runtime Semantics & Node Index when on Clean Architecture Spec */}
        {activeTab === "repolens-arch" && (
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div
                style={{
                  background: isDark ? "#0b121e" : "#ffffff",
                  border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.25)" : "#cbd5e1"}`,
                  borderRadius: "12px",
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px", fontWeight: 700, color: isDark ? "#38bdf8" : "#0284c7", marginBottom: "10px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#06b6d4", display: "inline-block" }} />
                  <span>Compiler Contract</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: "11.5px", color: isDark ? "#94a3b8" : "#475569", lineHeight: 1.6 }}>
                  <li><strong>AI explains the repository; static analysis establishes what actually exists:</strong> LLM inference is strictly anchored to Roslyn symbols and knowledge graph vertices.</li>
                  <li><strong>Strict read-only analysis:</strong> Zero arbitrary code execution, zero modifications outside ephemeral analysis workspaces.</li>
                  <li><strong>Analysis isolation boundary enforced by AnalysisId:</strong> Hard tenant separation ensuring no cross-analysis data contamination.</li>
                </ul>
              </div>

              <div
                style={{
                  background: isDark ? "#0b121e" : "#ffffff",
                  border: `1px solid ${isDark ? "rgba(244, 63, 94, 0.25)" : "#cbd5e1"}`,
                  borderRadius: "12px",
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px", fontWeight: 700, color: isDark ? "#f43f5e" : "#e11d48", marginBottom: "10px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f43f5e", display: "inline-block" }} />
                  <span>Runtime Semantics</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: "11.5px", color: isDark ? "#94a3b8" : "#475569", lineHeight: 1.6 }}>
                  <li><strong>Pipeline lifecycle strictly progresses from Created through Indexing or halts at Failed:</strong> Finite state machine strictly validates each state transition.</li>
                  <li><strong>Every architectural claim requires verified source location evidence:</strong> Answers missing concrete file paths and line ranges are discarded.</li>
                  <li><strong>Multi-path execution decouples relational indexing from vector indexing:</strong> Relational schema graphs and pgvector embedding indices update concurrently.</li>
                </ul>
              </div>
            </div>

            {/* Node Index Drawer */}
            <div
              style={{
                background: isDark ? "#0b121e" : "#ffffff",
                border: `1px solid ${isDark ? "#1e293b" : "#cbd5e1"}`,
                borderRadius: "12px",
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px", fontWeight: 700 }}>
                  <span>Node Index</span>
                  <span style={{ padding: "2px 7px", borderRadius: 99, background: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0", fontSize: "10.5px" }}>12 nodes</span>
                </div>
                <span style={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8" }}>
                  Grouped by Clean Architecture Swimlanes
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: isDark ? "#64748b" : "#94a3b8", textTransform: "uppercase", paddingBottom: 6, borderBottom: `1px dashed ${isDark ? "#1e293b" : "#e2e8f0"}`, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>01 Presentation & Ingress</span>
                    <span>3</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#06b6d4", fontWeight: 600 }}>• User / Client</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#06b6d4", fontWeight: 600 }}>• Next.js Frontend</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#06b6d4", fontWeight: 600 }}>• RepoLens.Api</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: isDark ? "#64748b" : "#94a3b8", textTransform: "uppercase", paddingBottom: 6, borderBottom: `1px dashed ${isDark ? "#1e293b" : "#e2e8f0"}`, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>02 Orchestration & Pipeline</span>
                    <span>3</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10b981", fontWeight: 600 }}>• Pipeline Orchestrator</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10b981", fontWeight: 600 }}>• Acquisition & Scanner</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#f43f5e", fontWeight: 600 }}>• Security Guard</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: isDark ? "#64748b" : "#94a3b8", textTransform: "uppercase", paddingBottom: 6, borderBottom: `1px dashed ${isDark ? "#1e293b" : "#e2e8f0"}`, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>03 Static Engine</span>
                    <span>4</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#38bdf8", fontWeight: 600 }}>• Roslyn C# Analyzer</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#38bdf8", fontWeight: 600 }}>• TS/JS AST Parser</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8b5cf6", fontWeight: 600 }}>• Knowledge Graph Builder</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ec4899", fontWeight: 600 }}>• Evidence Engine</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: isDark ? "#64748b" : "#94a3b8", textTransform: "uppercase", paddingBottom: 6, borderBottom: `1px dashed ${isDark ? "#1e293b" : "#e2e8f0"}`, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>04 Persistence & AI</span>
                    <span>3</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#f59e0b", fontWeight: 600 }}>• PostgreSQL (EF Core)</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#a855f7", fontWeight: 600 }}>• Vector Index (pgvector)</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#14b8a6", fontWeight: 600 }}>• Grounded RAG Engine</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
