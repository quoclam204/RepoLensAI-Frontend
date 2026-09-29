import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    fontWeight: 600,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.65 : 1,
    transition: "all 0.15s ease",
    border: "none",
    outline: "none",
  };

  const sizeStyle: React.CSSProperties =
    size === "sm"
      ? { padding: "6px 12px", fontSize: "0.8rem" }
      : size === "lg"
      ? { padding: "12px 24px", fontSize: "1rem" }
      : { padding: "8px 16px", fontSize: "0.9rem" };

  let variantStyle: React.CSSProperties = {};
  if (variant === "primary") {
    variantStyle = {
      backgroundColor: "#2563eb",
      color: "#ffffff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    };
  } else if (variant === "secondary") {
    variantStyle = {
      backgroundColor: "#1e293b",
      color: "#e2e8f0",
      border: "1px solid #334155",
    };
  } else if (variant === "outline") {
    variantStyle = {
      backgroundColor: "transparent",
      color: "#93c5fd",
      border: "1px solid #3b82f6",
    };
  } else if (variant === "danger") {
    variantStyle = {
      backgroundColor: "#dc2626",
      color: "#ffffff",
    };
  }

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        ...sizeStyle,
        ...variantStyle,
        ...style,
      }}
    >
      {loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
      {children}
    </button>
  );
}
