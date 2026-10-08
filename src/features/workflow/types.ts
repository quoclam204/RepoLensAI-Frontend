export type NodeRole =
  | "user-ui"
  | "agent-logic"
  | "policy"
  | "cloud-service"
  | "tool-action"
  | "external-system";

export interface PassportConnection {
  name: string;
  relation: string;
  targetId?: string;
  sourceId?: string;
}

export interface SemanticPassportData {
  categoryTag: string; // e.g. "FRONTEND", "CI/CD", "GOVERNANCE"
  path: string; // e.g. "Developer > Change"
  slug: string; // e.g. "pull_request"
  upstreamCount: number;
  downstreamCount: number;
  outgoing: PassportConnection[];
  incoming: PassportConnection[];
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  subtitle: string;
  role: NodeRole;
  iconName?: string;
  statusBadge?: string;
  passport: SemanticPassportData;
  isSelected?: boolean;
  isHovered?: boolean;
  onHoverStart?: (nodeId: string) => void;
  onHoverEnd?: (nodeId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  onClosePassport?: () => void;
}

export interface WorkflowEdgeData extends Record<string, unknown> {
  label?: string;
  labelVariant?: "cyan" | "emerald" | "rose" | "indigo" | "slate" | "amber";
  isDashed?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  isHighlighted?: boolean;
}

export interface SwimlaneConfig {
  id: string;
  numberPrefix: string;
  title: string;
  y: number;
  height: number;
  isFailureLane?: boolean;
}
