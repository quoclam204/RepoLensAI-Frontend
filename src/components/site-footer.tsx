"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/language-context";
import {
  RepoLensIcon,
  BoltIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  SunIcon,
  GlobeIcon,
  CpuIcon,
  PackageIcon,
  ArchitectureIcon,
  RouterNodeIcon,
} from "@/components/icons";

export function SiteFooter() {
  const { t } = useLanguage();

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="site-footer">
      <div className="page-shell">
        <div className="footer-main">
          {/* Brand & Mission */}
          <div className="footer-col footer-col-brand">
            <Link href="/" className="footer-brand-logo">
              <span className="brand-mark" aria-hidden="true">
                <RepoLensIcon size={24} variant="gradient" />
              </span>
              <span className="footer-brand-name">
                RepoLens <strong>AI</strong>
              </span>
            </Link>
            <p className="footer-tagline">{t("footer.tagline")}</p>
            <div className="footer-status-pill">
              <span className="pulse-dot active" aria-hidden="true" />
              <BoltIcon size={12} color="var(--accent)" />
              <span>{t("footer.systemStatus")}</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">{t("footer.product")}</h4>
            <ul className="footer-links">
              <li>
                <Link href="/analyze" className="footer-nav-link">
                  <ArrowRightIcon size={11} color="var(--accent)" />
                  <span>{t("footer.navAnalyze")}</span>
                </Link>
              </li>
              <li>
                <Link href="/projects/demo-analysis/overview" className="footer-nav-link">
                  <ArrowRightIcon size={11} color="var(--accent)" />
                  <span>{t("footer.navWorkspace")}</span>
                </Link>
              </li>
              <li>
                <Link href="/projects/demo-analysis/architecture" className="footer-nav-link">
                  <ArrowRightIcon size={11} color="var(--accent)" />
                  <span>{t("footer.navArchitecture")}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Capabilities */}
          <div className="footer-col">
            <h4 className="footer-col-title">{t("footer.capabilities")}</h4>
            <ul className="footer-links static-list">
              <li>
                <PackageIcon size={14} color="var(--accent)" className="footer-feature-icon" />
                <span>{t("footer.capPolyglot")}</span>
              </li>
              <li>
                <ArchitectureIcon size={14} color="var(--accent)" className="footer-feature-icon" />
                <span>{t("footer.capArchitecture")}</span>
              </li>
              <li>
                <RouterNodeIcon size={14} color="var(--accent)" className="footer-feature-icon" />
                <span>{t("footer.capDiagrams")}</span>
              </li>
            </ul>
          </div>

          {/* Preferences & Quick Actions */}
          <div className="footer-col footer-col-actions">
            <h4 className="footer-col-title">Platform</h4>
            <div className="footer-feature-tags">
              <span className="footer-tag-chip">
                <SunIcon size={12} color="var(--accent)" />
                <span>Dark / Light</span>
              </span>
              <span className="footer-tag-chip">
                <GlobeIcon size={12} color="var(--accent)" />
                <span>VI / EN</span>
              </span>
              <span className="footer-tag-chip">
                <CpuIcon size={12} color="var(--accent)" />
                <span>Realtime AST</span>
              </span>
            </div>
            <button
              type="button"
              onClick={scrollToTop}
              className="footer-back-to-top"
              aria-label={t("footer.backToTop")}
            >
              <ArrowUpIcon size={13} />
              <span>{t("footer.backToTop")}</span>
            </button>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>© {new Date().getFullYear()} RepoLens AI. {t("footer.rights")}</span>
          </div>
          <div className="footer-bottom-right">
            <span className="footer-theme-info">{t("footer.themeStatus")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

