"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="theme-toggle-btn"
        aria-label="Toggle light and dark theme"
        style={{ opacity: 0 }}
      >
        <span style={{ fontSize: "14px" }}>🌙</span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${isDark ? "is-dark" : "is-light"}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "Light mode (Giao diện Sáng)" : "Dark mode (Giao diện Tối)"}`}
    >
      <span className="theme-toggle-icon">{isDark ? "☀️" : "🌙"}</span>
      <span className="theme-toggle-label">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
