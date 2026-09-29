import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  style,
  ...rest
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 6,
    fontWeight: 600,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "all 0.15s ease",
    border: "1px solid transparent",
    outline: "none",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const sizeStyle: React.CSSProperties =
    size === "sm"
      ? { padding: "5px 10px", fontSize: "0.78rem", height: 28 }
      : size === "lg"
      ? { padding: "10px 20px", fontSize: "0.95rem", height: 42 }
      : size === "icon"
      ? { padding: 6, width: 32, height: 32 }
      : { padding: "7px 14px", fontSize: "0.85rem", height: 34 };

  let variantStyle: React.CSSProperties = {};
  if (variant === "primary") {
    variantStyle = {
      backgroundColor: "var(--accent, #c5b6ff)",
      color: "#111015",
      borderColor: "var(--accent, #c5b6ff)",
      fontWeight: 700,
      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    };
  } else if (variant === "secondary") {
    variantStyle = {
      backgroundColor: "var(--panel-raised, #17171d)",
      color: "#d4d0dc",
      borderColor: "var(--line-bright, #3b3945)",
    };
  } else if (variant === "outline") {
    variantStyle = {
      backgroundColor: "transparent",
      color: "var(--accent, #c5b6ff)",
      borderColor: "var(--line-bright, #3b3945)",
    };
  } else if (variant === "ghost") {
    variantStyle = {
      backgroundColor: "transparent",
      color: "var(--muted, #8b8995)",
      borderColor: "transparent",
    };
  } else if (variant === "danger") {
    variantStyle = {
      backgroundColor: "rgba(239, 68, 68, 0.15)",
      color: "#fca5a5",
      borderColor: "rgba(239, 68, 68, 0.3)",
    };
  }

  const variantClass =
    variant === "primary"
      ? "primary-button"
      : variant === "secondary"
      ? "secondary-button"
      : "";

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(variantClass, className)}
      style={{
        ...baseStyle,
        ...sizeStyle,
        ...variantStyle,
        ...style,
      }}
    >
      {loading && <span className="spinner" style={{ width: 13, height: 13 }} />}
      {children}
    </button>
  );
}

export default Button;
