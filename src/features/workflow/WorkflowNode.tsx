"use client";

import React, { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { WorkflowNodeData, NodeRole } from "./types";
import {
  CommitIcon,
  PullRequestIcon,
  BuildCodeIcon,
  QualityGatesIcon,
  ApproveIcon,
  DeployCloudIcon,
  AnnounceIcon,
  AlertOctagonIcon,
  RollbackIcon,
  CopyIcon,
  CheckIcon,
  CloseIcon,
} from "./WorkflowIcons";

/**
 * Visual styling theme based on the node's architectural role
 */
const ROLE_STYLES: Record<
  NodeRole,
  {
    border: string;
    bg: string;
    text: string;
    iconColor: string;
    glow: string;
  }
> = {
  "user-ui": {
    border: "border-cyan-400 dark:border-cyan-400",
    bg: "bg-cyan-50/70 dark:bg-[#0c2233]/90",
    text: "text-slate-800 dark:text-cyan-100",
    iconColor: "text-cyan-500 dark:text-cyan-400",
    glow: "shadow-[0_0_24px_rgba(6,182,212,0.45)]",
  },
  "agent-logic": {
    border: "border-emerald-500 dark:border-emerald-400",
    bg: "bg-emerald-50/70 dark:bg-[#0d2a22]/90",
    text: "text-slate-800 dark:text-emerald-100",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    glow: "shadow-[0_0_24px_rgba(16,185,129,0.45)]",
  },
  policy: {
    border: "border-rose-400 dark:border-rose-400",
    bg: "bg-rose-50/70 dark:bg-[#2b111e]/90",
    text: "text-slate-800 dark:text-rose-100",
    iconColor: "text-rose-500 dark:text-rose-400",
    glow: "shadow-[0_0_24px_rgba(244,63,94,0.45)]",
  },
  "cloud-service": {
    border: "border-amber-400 dark:border-amber-400",
    bg: "bg-amber-50/70 dark:bg-[#2a220c]/90",
    text: "text-slate-800 dark:text-amber-100",
    iconColor: "text-amber-500 dark:text-amber-400",
    glow: "shadow-[0_0_24px_rgba(245,158,11,0.45)]",
  },
  "tool-action": {
    border: "border-orange-400 dark:border-orange-400",
    bg: "bg-orange-50/70 dark:bg-[#2b170c]/90",
    text: "text-slate-800 dark:text-orange-100",
    iconColor: "text-orange-500 dark:text-orange-400",
    glow: "shadow-[0_0_24px_rgba(249,115,22,0.45)]",
  },
  "external-system": {
    border: "border-slate-400 dark:border-slate-400",
    bg: "bg-slate-100/80 dark:bg-[#171f2c]/90",
    text: "text-slate-800 dark:text-slate-100",
    iconColor: "text-slate-500 dark:text-slate-300",
    glow: "shadow-[0_0_24px_rgba(148,163,184,0.45)]",
  },
};

function getNodeIcon(iconName?: string) {
  switch (iconName) {
    case "commit":
      return <CommitIcon size={16} />;
    case "pull-request":
      return <PullRequestIcon size={16} />;
    case "build":
      return <BuildCodeIcon size={16} />;
    case "quality-gates":
      return <QualityGatesIcon size={16} />;
    case "approve":
      return <ApproveIcon size={16} />;
    case "deploy":
      return <DeployCloudIcon size={16} />;
    case "verify":
      return <BuildCodeIcon size={16} />;
    case "announce":
      return <AnnounceIcon size={16} />;
    case "stop-release":
      return <AlertOctagonIcon size={16} />;
    case "rollback":
      return <RollbackIcon size={16} />;
    default:
      return <PullRequestIcon size={16} />;
  }
}

export const WorkflowNode = memo(function WorkflowNode(props: NodeProps) {
  const { id } = props;
  const data = props.data as unknown as WorkflowNodeData;
  const [copied, setCopied] = useState(false);
  const style = ROLE_STYLES[data.role] || ROLE_STYLES["user-ui"];
  const isSelected = !!data.isSelected;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(window.location.href + `#node-${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onClosePassport?.();
  };

  return (
    <div
      className="relative group select-none"
      onMouseEnter={() => data.onHoverStart?.(id)}
      onMouseLeave={() => data.onHoverEnd?.(id)}
      onClick={() => data.onSelectNode?.(id)}
    >
      {/* Target & Source Handles for Step Connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0 opacity-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0 opacity-0"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0 opacity-0"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0 opacity-0"
      />

      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        className="!w-2 !h-2 !bg-transparent !border-0 !min-w-0 !min-h-0 opacity-0"
      />

      {/* Main Node Card */}
      <div
        className={`
          relative flex flex-col justify-between
          w-[146px] min-h-[76px] p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
          backdrop-blur-md
          ${style.border} ${style.bg}
          ${isSelected ? `ring-2 ring-cyan-400 dark:ring-cyan-300 ${style.glow} scale-[1.03] z-20` : "hover:scale-[1.01] hover:brightness-105 z-10"}
        `}
      >
        {/* Top bar with icon */}
        <div className="flex items-center justify-between mb-1">
          <div className={`${style.iconColor} flex items-center`}>
            {getNodeIcon(data.iconName)}
          </div>
          {data.statusBadge && (
            <span className="text-[10px] font-mono tracking-tight text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {data.statusBadge}
            </span>
          )}
        </div>

        {/* Node Title */}
        <div className={`font-mono font-bold text-sm leading-tight tracking-tight ${style.text}`}>
          {data.label}
        </div>

        {/* Node Subtitle */}
        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
          {data.subtitle}
        </div>
      </div>

      {/* Semantic Passport Popover Card (Screenshot 3 Replication) */}
      {isSelected && data.passport && (
        <div
          className={`
            absolute -top-6 -left-[275px] z-50 w-[265px]
            bg-white dark:bg-[#0c1622] text-slate-800 dark:text-slate-100
            rounded-2xl border border-slate-200 dark:border-cyan-900/60 shadow-2xl
            p-4 text-xs font-sans animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase font-mono">
              SEMANTIC PASSPORT
            </span>
            <button
              onClick={handleClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
              title="Close passport"
            >
              <CloseIcon size={12} />
            </button>
          </div>

          {/* Node identity */}
          <div className="flex items-start justify-between gap-1 mb-1">
            <div>
              <h4 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white font-mono">
                {data.label}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {data.subtitle}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline pt-0.5"
            >
              {copied ? (
                <>
                  <CheckIcon size={10} className="text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <CopyIcon size={10} /> Copy link
                </>
              )}
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 my-2.5">
            <span className="px-2 py-0.5 text-[9px] font-bold font-mono tracking-wide rounded-full border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10">
              {data.passport.categoryTag}
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80">
              {data.passport.path}
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono rounded-full border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80">
              {data.passport.slug}
            </span>
          </div>

          {/* Counts */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 font-mono">
            {data.passport.outgoing.length} outgoing · {data.passport.incoming.length} incoming
          </div>

          {/* Authored Reach Panel */}
          <div className="mb-3">
            <div className="text-[9px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-1">
              AUTHORED REACH
            </div>
            <div className="grid grid-cols-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 overflow-hidden text-center divide-x divide-slate-200 dark:divide-slate-800">
              <div className="py-1.5 px-2 flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Upstream</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {data.passport.upstreamCount}
                </span>
              </div>
              <div className="py-1.5 px-2 flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Downstream</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {data.passport.downstreamCount}
                </span>
              </div>
            </div>
          </div>

          {/* Outgoing List */}
          {data.passport.outgoing.length > 0 && (
            <div className="mb-2.5">
              <div className="text-[9px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-1">
                OUTGOING · {data.passport.outgoing.length}
              </div>
              <div className="space-y-1">
                {data.passport.outgoing.map((conn, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded-md bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                        OUT →
                      </span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {conn.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {conn.relation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incoming List */}
          {data.passport.incoming.length > 0 && (
            <div>
              <div className="text-[9px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-1">
                INCOMING · {data.passport.incoming.length}
              </div>
              <div className="space-y-1">
                {data.passport.incoming.map((conn, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded-md bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                        ← IN
                      </span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {conn.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {conn.relation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

WorkflowNode.displayName = "WorkflowNode";
