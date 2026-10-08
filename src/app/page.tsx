"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/language-context";
import { RepoLensIcon, BoltIcon } from "@/components/icons";

export default function HomePage() {
  const { t } = useLanguage();

  const supportedTechs = ["C# / .NET", "Java / Spring", "Python", "Go", "PHP", "TypeScript / Node"];

  return (
    <main className="home-page">
      <div className="page-shell home-grid">
        <section className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" aria-hidden="true" />
            <span className="hero-badge-text">{t("home.eyebrow")}</span>
          </div>

          <h1 className="hero-title">
            {t("home.title")}
          </h1>

          <p className="lead">{t("home.lead")}</p>

          <div className="actions">
            <Link className="button primary hero-cta" href="/analyze">
              <span>{t("home.openAnalyze")}</span>
              <span className="cta-arrow" aria-hidden="true">→</span>
            </Link>
            <Link className="button secondary hero-secondary" href="/projects/demo-analysis/overview">
              {t("home.viewRouteShell")}
            </Link>
          </div>

          <div className="hero-tags">
            <span className="hero-tags-label">Polyglot:</span>
            <div className="hero-tags-list">
              {supportedTechs.map((tech) => (
                <span key={tech} className="hero-tag-pill">{tech}</span>
              ))}
            </div>
          </div>
        </section>

        <aside className="foundation-card blueprint-card">
          <div className="blueprint-header">
            <div className="blueprint-controls" aria-hidden="true">
              <span className="mac-dot red" />
              <span className="mac-dot yellow" />
              <span className="mac-dot green" />
            </div>
            <span className="status-badge">
              <BoltIcon size={12} color="currentColor" style={{ marginRight: 2 }} />
              Archify V3 Engine
            </span>
          </div>

          <div className="blueprint-preview" aria-hidden="true">
            <div className="blueprint-layer api-layer">
              <span className="layer-tag">Presentation</span>
              <span className="layer-name">API Controllers & Endpoints</span>
            </div>
            <div className="blueprint-connector">
              <span className="connector-line" />
              <span className="connector-arrow">↓</span>
            </div>
            <div className="blueprint-layer app-layer">
              <span className="layer-tag">Application</span>
              <span className="layer-name">Services, Handlers & CQRS</span>
            </div>
            <div className="blueprint-connector">
              <span className="connector-line" />
              <span className="connector-arrow">↓</span>
            </div>
            <div className="blueprint-layer domain-layer">
              <span className="layer-tag">Domain & Database</span>
              <span className="layer-name">Entities, Schemas & Relations</span>
            </div>
          </div>

          <div className="blueprint-features">
            <h3>{t("home.deliverables")}</h3>
            <ul>
              <li>
                <span className="check-mark" aria-hidden="true">✓</span>
                <span>{t("home.feature1")}</span>
              </li>
              <li>
                <span className="check-mark" aria-hidden="true">✓</span>
                <span>{t("home.feature2")}</span>
              </li>
              <li>
                <span className="check-mark" aria-hidden="true">✓</span>
                <span>{t("home.feature3")}</span>
              </li>
              <li>
                <span className="check-mark" aria-hidden="true">✓</span>
                <span>{t("home.feature4")}</span>
              </li>
              <li>
                <span className="check-mark" aria-hidden="true">✓</span>
                <span>{t("home.feature5")}</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
