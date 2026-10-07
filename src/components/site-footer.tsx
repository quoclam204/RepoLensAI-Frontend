"use client";

import { useLanguage } from "@/i18n/language-context";

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="page-shell footer-inner">
        <span>{t("footer.brand")}</span>
        <span>{t("footer.themeStatus")}</span>
      </div>
    </footer>
  );
}
