import type { CSSProperties, ReactNode } from "react";

/** Minimal primitive container; not a design system. */
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 8,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
