"use client";

import React, { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { WorkflowEdgeData } from "./types";

const LABEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-[#072419]",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-300 dark:border-emerald-500/50",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-[#2e0915]",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-300 dark:border-rose-500/50",
  },
  indigo: {
    bg: "bg-purple-50 dark:bg-[#1a0f35]",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-300 dark:border-purple-500/50",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-[#07202c]",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-300 dark:border-cyan-500/50",
  },
  slate: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-300 dark:border-slate-700",
  },
};

export const WorkflowEdge = memo(function WorkflowEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
  } = props;
  const data = props.data as unknown as WorkflowEdgeData | undefined;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const isDashed = data?.isDashed ?? false;
  const isHighlighted = !!data?.isHighlighted;
  const color = data?.strokeColor || (style.stroke as string) || "#94a3b8";
  const labelVariant = data?.labelVariant || "slate";
  const labelStyle = LABEL_COLORS[labelVariant] || LABEL_COLORS.slate;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isHighlighted ? (data?.strokeColor || "#22d3ee") : color,
          strokeWidth: isHighlighted ? 3.5 : (data?.strokeWidth || 2),
          strokeDasharray: isDashed ? "5 5" : undefined,
          filter: isHighlighted
            ? `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 2px ${color})`
            : undefined,
          transition: "all 0.2s ease-in-out",
        }}
      />

      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={`
              px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border
              shadow-sm backdrop-blur-md transition-all duration-200
              ${labelStyle.bg} ${labelStyle.text} ${labelStyle.border}
              ${isHighlighted ? "scale-110 shadow-[0_0_12px_rgba(34,211,238,0.5)] ring-1 ring-cyan-400" : ""}
            `}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

WorkflowEdge.displayName = "WorkflowEdge";
