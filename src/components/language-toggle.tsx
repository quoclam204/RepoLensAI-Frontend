"use client";

import { useLanguage } from "@/i18n/language-context";
import { useEffect, useState } from "react";

export function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="language-toggle-btn"
        aria-label="Language selection"
        style={{ opacity: 0 }}
      >
        <span>🇻🇳 VI</span>
      </button>
    );
  }

  const isVi = language === "vi";

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`language-toggle-btn ${isVi ? "is-vi" : "is-en"}`}
      aria-label={t("nav.switchLanguage")}
      title={isVi ? "Bấm để đổi sang English" : "Click to switch to Tiếng Việt"}
    >
      <span className="language-flag" aria-hidden="true">
        {isVi ? "🇻🇳" : "🇬🇧"}
      </span>
      <span className="language-code">{isVi ? "VI" : "EN"}</span>
      <span className="language-switch-hint">
        {isVi ? "EN" : "VI"}
      </span>
    </button>
  );
}
