"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@/components/icons";

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
        <MoonIcon size={14} />
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
      <span className="theme-toggle-icon">
        {isDark ? <SunIcon size={14} color="#f59e0b" /> : <MoonIcon size={14} color="#0b8f68" />}
      </span>
      <span className="theme-toggle-label">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
