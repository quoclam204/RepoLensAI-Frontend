"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/language-context";

export function SiteNav() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const isAnalyze = pathname.startsWith("/analyze");
  const isWorkspace = pathname.startsWith("/projects") && pathname.includes("/overview");
  const isArchitecture = pathname.includes("/architecture");

  return (
    <nav className="main-nav" aria-label="Main navigation">
      <Link href="/analyze" className={isAnalyze ? "active" : ""}>
        {t("nav.analyze")}
      </Link>
      <Link href="/projects/demo-analysis/overview" className={isWorkspace ? "active" : ""}>
        {t("nav.workspace")}
      </Link>
      <Link href="/projects/demo-analysis/architecture" className={isArchitecture ? "active" : ""}>
        {t("nav.architecture")}
      </Link>
    </nav>
  );
}
