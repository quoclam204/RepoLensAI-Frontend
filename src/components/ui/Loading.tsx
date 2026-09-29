import type { CSSProperties } from "react";

export interface LoadingProps {
  label?: string;
  style?: CSSProperties;
  size?: "sm" | "md" | "lg";
}

export function Loading({ label = "Loading...", style, size = "md" }: LoadingProps) {
  const spinnerSize = size === "sm" ? 14 : size === "lg" ? 28 : 20;

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "20px 0",
        color: "var(--text-secondary, #94a3b8)",
        fontSize: "0.9rem",
        ...style,
      }}
    >
      <span
        className="spinner"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderTopColor: "var(--accent-primary, #3b82f6)",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
