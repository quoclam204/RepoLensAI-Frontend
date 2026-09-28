import type { ButtonHTMLAttributes } from "react";

/** Minimal primitive button; not a design system. */
export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { style, ...rest } = props;
  return (
    <button
      {...rest}
      style={{
        border: "1px solid #ccc",
        borderRadius: 6,
        padding: "8px 16px",
        cursor: "pointer",
        ...style,
      }}
    />
  );
}
