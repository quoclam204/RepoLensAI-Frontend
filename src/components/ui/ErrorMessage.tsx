import type { CSSProperties } from "react";
import { AlertCircle } from "lucide-react";

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
      className="error-state"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        backgroundColor: "rgba(71, 31, 39, 0.35)",
        border: "1px solid #673d46",
        borderRadius: 6,
        color: "#e8c2c2",
        fontSize: "0.85rem",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="state-icon error-icon" style={{ width: 28, height: 28, marginBottom: 0 }}>
          <AlertCircle size={15} />
        </span>
        <div>
          {code && (
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "0.75rem",
                color: "var(--danger, #ef9a9a)",
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
          className="secondary-button"
          style={{ height: 28, fontSize: "0.78rem" }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
