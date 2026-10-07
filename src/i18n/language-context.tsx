"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type Language, type TranslationKey, translations } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "vi",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: TranslationKey) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read saved language preference
    const saved = localStorage.getItem("repolens_language") as Language | null;
    if (saved === "vi" || saved === "en") {
      setLanguageState(saved);
      document.documentElement.setAttribute("lang", saved);
    } else {
      // Default based on browser language
      const browserLang = navigator.language.toLowerCase();
      const initial: Language = browserLang.startsWith("vi") ? "vi" : "en";
      setLanguageState(initial);
      document.documentElement.setAttribute("lang", initial);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("repolens_language", lang);
    document.documentElement.setAttribute("lang", lang);
    window.dispatchEvent(new CustomEvent("repolens_language_change", { detail: lang }));
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === "vi" ? "en" : "vi";
    setLanguage(nextLang);
  };

  const t = (key: TranslationKey): string => {
    const langDict = translations[language] || translations.vi;
    return (langDict as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
