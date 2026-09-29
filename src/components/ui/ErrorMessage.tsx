import type { CSSProperties } from "react";

export interface ErrorMessageProps {
  message: string;
  code?: string;
  style?: CSSProperties;
  onRetry?: () => void;
}

export function ErrorMessage({ message, code, style, onRetry }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      style={{
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: 8,
        padding: "12px 16px",
        color: "#fca5a5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: "0.9rem",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1.1rem" }}>?</span>
        <div>
          {code && (
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "0.75rem",
                color: "#f87171",
                marginRight: 8,
              }}
            >
              [{code}]
            </span>
          )}
          <span>{message}</span>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "rgba(239, 68, 68, 0.2)",
            color: "#fef2f2",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
