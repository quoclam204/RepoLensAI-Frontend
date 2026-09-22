"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProjectNavigation } from "@/components/project-navigation";
import { analysisGateway } from "@/services/analysis-gateway";
import type { AnalysisStatus, AnalysisSummary, RepositoryOverview } from "@/types/api";

const stages: AnalysisStatus[] = ["Acquiring", "Scanning", "Analyzing", "Indexing", "Completed"];

export function OverviewDashboard({ analysisId }: { analysisId: string }) {
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [overview, setOverview] = useState<RepositoryOverview | null>(null);
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
      <main className="workspace-page"><div className="page-shell"><section className="state-panel"><h1>Unable to load analysis</h1><p>{error}</p><div className="state-actions"><button className="button primary" onClick={() => setRetryKey((value) => value + 1)}>Retry</button><Link className="button secondary" href="/analyze">New analysis</Link></div></section></div></main>
    );
  }

  if (!analysis) {
    return <main className="workspace-page"><div className="page-shell"><section className="state-panel"><span className="spinner" /><h1>Loading analysis</h1><p>Retrieving the current lifecycle state.</p></section></div></main>;
  }

  const running = analysis.status !== "Completed" && analysis.status !== "Failed";

  return (
    <main className="workspace-page">
      <div className="page-shell">
        <ProjectNavigation projectId={analysisId} />
        <div className="overview-heading">
          <div><p className="eyebrow">Repository overview</p><h1>{analysis.repositoryName}</h1><p>{analysis.repositoryUrl ?? `Analysis ID: ${analysis.id}`}</p></div>
          <span className={`lifecycle-badge ${running ? "running" : analysis.status.toLowerCase()}`}><i />{analysis.status}</span>
        </div>

        <section className="progress-card">
          <div><strong>{running ? "Analysis in progress" : analysis.status === "Completed" ? "Analysis complete" : "Analysis failed"}</strong><span>{analysis.progress}%</span></div>
          <div className="progress-track"><i style={{ width: `${analysis.progress}%` }} /></div>
          <div className="stage-row">{stages.map((stage) => <span className={stage === analysis.status ? "current" : ""} key={stage}>{stage}</span>)}</div>
        </section>

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
