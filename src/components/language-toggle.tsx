"use client";

import { useLanguage } from "@/i18n/language-context";
import { useEffect, useState } from "react";

function VnFlag() {
  return (
    <svg
      width="15"
      height="11"
      viewBox="0 0 16 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="lang-flag-svg"
      aria-hidden="true"
    >
      <rect width="16" height="12" fill="#DA251D" />
      <path
        d="M8 2.2L9.15 5.75H12.87L9.86 7.94L11.01 11.49L8 9.3L4.99 11.49L6.14 7.94L3.13 5.75H6.85L8 2.2Z"
        fill="#FFEB3B"
      />
    </svg>
  );
}

function UkFlag() {
  return (
    <svg
      width="15"
      height="11"
      viewBox="0 0 16 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="lang-flag-svg"
      aria-hidden="true"
    >
      <clipPath id="uk-flag-clip-seg">
        <rect width="16" height="12" />
      </clipPath>
      <g clipPath="url(#uk-flag-clip-seg)">
        <rect width="16" height="12" fill="#012169" />
        <path d="M0 0L16 12M16 0L0 12" stroke="#FFFFFF" strokeWidth="2.4" />
        <path d="M0 0L16 12M16 0L0 12" stroke="#C8102E" strokeWidth="1.2" />
        <path d="M8 0V12M0 6H16" stroke="#FFFFFF" strokeWidth="4" />
        <path d="M8 0V12M0 6H16" stroke="#C8102E" strokeWidth="2.4" />
      </g>
    </svg>
  );
}

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="language-switcher"
        style={{ opacity: 0, pointerEvents: "none", width: "114px", height: "33px" }}
        aria-hidden="true"
      />
    );
  }

  const isVi = language === "vi";

  return (
    <div
      className="language-switcher"
      role="group"
      aria-label={t("nav.switchLanguage")}
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`language-switcher-btn ${!isVi ? "is-active" : ""}`}
        aria-pressed={!isVi}
        title="Switch to English"
      >
        <UkFlag />
        <span className="lang-label">EN</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage("vi")}
        className={`language-switcher-btn ${isVi ? "is-active" : ""}`}
        aria-pressed={isVi}
        title="Chuyển sang Tiếng Việt"
      >
        <VnFlag />
        <span className="lang-label">VI</span>
      </button>
    </div>
  );
}



