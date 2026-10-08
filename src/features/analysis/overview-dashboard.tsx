"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProjectNavigation } from "@/components/project-navigation";
import { analysisGateway } from "@/services/analysis-gateway";
import { useLanguage } from "@/i18n/language-context";
import { PackageIcon } from "@/components/icons";
import type { AnalysisStatus, AnalysisSummary, RepositoryOverview, RepositoryClassification } from "@/types/api";

const stages: AnalysisStatus[] = ["Acquiring", "Scanning", "Analyzing", "Indexing", "Completed"];

export function OverviewDashboard({ analysisId }: { analysisId: string }) {
  const { t } = useLanguage();
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [overview, setOverview] = useState<RepositoryOverview | null>(null);
  const [classification, setClassification] = useState<RepositoryClassification | null>(null);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const current = await analysisGateway.get(analysisId);
        if (!active) return;
        setAnalysis(current);
        setError("");

        if (current.status === "Completed") {
          const data = await analysisGateway.overview(analysisId);
          if (active) setOverview(data);
          analysisGateway.classification(analysisId).then((cls) => {
            if (active) setClassification(cls);
          }).catch(() => {});
          return;
        }
        if (current.status === "Failed") return;
        timer = setTimeout(poll, 2000);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Unable to load the analysis.");
      }
    }

    poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [analysisId, retryKey]);

  if (error) {
    return (
      <main className="workspace-page">
        <div className="page-shell">
          <section className="state-panel">
            <h1>{t("overview.unableToLoad")}</h1>
            <p>{error.includes("404") ? t("overview.backend404") : error}</p>
            <div className="state-actions">
              <button className="button primary" onClick={() => setRetryKey((value) => value + 1)}>
                {t("overview.retry")}
              </button>
              <Link className="button secondary" href="/analyze">
                {t("overview.newAnalysis")}
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="workspace-page">
        <div className="page-shell">
          <section className="state-panel">
            <span className="spinner" />
            <h1>{t("overview.loadingTitle")}</h1>
            <p>{t("overview.loadingDesc")}</p>
          </section>
        </div>
      </main>
    );
  }

  const running = analysis.status !== "Completed" && analysis.status !== "Failed";

  const repoSource = analysis.repositoryUrl || overview?.sourceLocation;

  const extractNameFromSource = (src?: string) => {
    if (!src) return "";
    const clean = src.replace(/\\/g, "/").split("/").filter(Boolean).pop();
    if (!clean) return "";
    return clean.replace(/\.git$/i, "").replace(/\.zip$/i, "") || clean;
  };

  const repoTitle =
    (overview?.repositoryName && overview.repositoryName !== "Repository" ? overview.repositoryName : "") ||
    (analysis.repositoryName && analysis.repositoryName !== "Repository" ? analysis.repositoryName : "") ||
    extractNameFromSource(repoSource) ||
    overview?.repositoryName ||
    analysis.repositoryName ||
    "Repository";

  return (
    <main className="workspace-page">
      <div className="page-shell">
        <ProjectNavigation projectId={analysisId} />
        <div className="overview-heading">
          <div>
            <p className="eyebrow">{t("overview.heading")}</p>
            <h1>{repoTitle}</h1>
            <p style={{ wordBreak: "break-all" }}>
              {repoSource ? (
                <>
                  <span>{repoSource}</span>
                  <span style={{ opacity: 0.6, marginLeft: "8px" }}>• Analysis ID: {analysis.id}</span>
                </>
              ) : (
                `Analysis ID: ${analysis.id}`
              )}
            </p>
          </div>
          <span className={`lifecycle-badge ${running ? "running" : analysis.status.toLowerCase()}`}>
            <i />{analysis.status}
          </span>
        </div>

        <section className="progress-card">
          <div className="progress-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>
              {running ? t("overview.inProgress") : analysis.status === "Completed" ? t("overview.complete") : t("overview.failed")}
            </strong>
            <span style={{ fontWeight: 700, color: "var(--accent)" }}>{analysis.progress}%</span>
          </div>
          <div className="progress-track">
            <i style={{ width: `${analysis.progress}%` }} />
          </div>
          <div className="stage-row">
            {stages.map((stage) => (
              <span className={stage === analysis.status ? "current" : ""} key={stage}>
                {stage}
              </span>
            ))}
          </div>
        </section>

        {analysis.status === "Completed" && (
          <>
            {classification && (
              <div
                className="classification-card"
                style={{
                  marginTop: "16px",
                  padding: "16px 20px",
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "14px",
                  backdropFilter: "blur(14px)",
                  boxShadow: "var(--card-shadow)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "var(--accent-soft)",
                      border: "1px solid rgba(16, 185, 129, 0.35)",
                      color: "var(--accent)",
                      fontWeight: 750,
                      fontSize: "12px",
                    }}
                  >
                    <PackageIcon size={14} color="currentColor" />
                    <span>{t("overview.repoType")}:</span>
                    <span style={{ fontWeight: 800 }}>{classification.type}</span>
                    <span style={{ fontSize: "11px", opacity: 0.85 }}>({classification.confidence} {t("overview.confidence")})</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--muted)", maxWidth: 640, lineHeight: 1.5 }}>
                    {classification.summary}
                  </p>
                </div>
                {classification.detectedLanguages?.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {classification.detectedLanguages.map((lang) => (
                      <span
                        key={lang}
                        style={{
                          padding: "3px 9px",
                          borderRadius: "6px",
                          background: "var(--soft)",
                          color: "var(--ink)",
                          border: "1px solid var(--line)",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                marginTop: classification ? "12px" : "20px",
                marginBottom: "20px",
                padding: "18px 24px",
                background: "linear-gradient(135deg, rgba(11,143,104,0.08) 0%, rgba(16,35,31,0.03) 100%)",
                border: "1px solid rgba(11,143,104,0.3)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
            <div>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 9px",
                  fontSize: "11px",
                  fontWeight: 700,
                  borderRadius: "20px",
                  background: "#dff6ed",
                  color: "#0b8f68",
                  marginBottom: "6px",
                }}
              >
                {t("overview.diagramReady")}
              </span>
              <h2 style={{ margin: "2px 0 4px", fontSize: "18px", fontWeight: 700 }}>
                {t("overview.diagramTitle")}
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
                {t("overview.diagramDesc")}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Link
                className="button primary"
                href={`/projects/${encodeURIComponent(analysisId)}/architecture`}
              >
                {t("overview.openDiagram")}
              </Link>
              <Link
                className="button secondary"
                href={`/projects/${encodeURIComponent(analysisId)}/dependencies`}
              >
                {t("overview.viewDeps")}
              </Link>
            </div>
          </div>
        </>
      )}

        {analysis.status === "Failed" ? (
          <section className="state-panel compact"><h2>Analysis failed</h2><p>{analysis.failureReason ?? "The backend did not provide a failure reason."}</p></section>
        ) : overview ? (
          <OverviewContent overview={overview} />
        ) : (
          <section className="state-panel compact"><span className="spinner" /><h2>Building repository knowledge</h2><p>This page updates automatically. You do not need to refresh it.</p></section>
        )}
      </div>
    </main>
  );
}

function OverviewContent({ overview }: { overview: RepositoryOverview }) {
  const metrics = [
    ["Files", overview.fileCount.toLocaleString()],
    ["Projects", overview.projectCount.toLocaleString()],
    ["Symbols", overview.symbolCount.toLocaleString()],
    ["API endpoints", overview.endpointCount.toLocaleString()],
  ];

  return (
    <>
      <section className="metric-grid">{metrics.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
      <div className="overview-grid">
        <section className="overview-card">
          <header><div><p className="eyebrow">Composition</p><h2>Languages</h2></div><span>{overview.lineCount.toLocaleString()} lines</span></header>
          {overview.languages.length ? overview.languages.map((language) => (
            <div className="language-row" key={language.name}><span>{language.name}</span><div><i style={{ width: `${language.percentage}%` }} /></div><strong>{language.percentage}%</strong></div>
          )) : <p className="empty-copy">No language statistics were returned.</p>}
        </section>
        <section className="overview-card">
          <header><div><p className="eyebrow">Structure</p><h2>Detected projects</h2></div><span>Branch: {overview.defaultBranch ?? "Unknown"}</span></header>
          <div className="project-list">{overview.projects.length ? overview.projects.map((project) => <div key={project.name}><span><strong>{project.name}</strong><small>{project.type}</small></span><b>{project.fileCount} files</b></div>) : <p className="empty-copy">No projects were returned.</p>}</div>
        </section>
      </div>
    </>
  );
}
