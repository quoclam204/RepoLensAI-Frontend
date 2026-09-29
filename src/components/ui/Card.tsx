import type { CSSProperties, ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, style, className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        backgroundColor: "var(--bg-card, #131b2e)",
        border: "1px solid var(--border-color, #27354f)",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        transition: onClick ? "border-color 0.2s, background-color 0.2s" : undefined,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
