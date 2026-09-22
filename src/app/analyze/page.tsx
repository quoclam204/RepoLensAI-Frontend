import type { Metadata } from "next";
import { AnalyzeForm } from "@/features/analysis/analyze-form";

export const metadata: Metadata = { title: "New analysis" };

const steps = [
  ["Acquire", "Validate and prepare the repository in an isolated backend workspace."],
  ["Scan", "Detect files, languages, projects and repository structure."],
  ["Analyze", "Build source-backed symbols, dependencies and relationships."],
  ["Index", "Prepare knowledge and evidence for exploration and retrieval."],
];

export default function AnalyzePage() {
  return (
    <main className="workspace-page">
      <div className="page-shell">
        <div className="analyze-intro"><p className="eyebrow">New repository analysis</p><h1>Give RepoLens a place to start.</h1><p>Submit a public Git repository or a ZIP archive. RepoLens follows the full analysis lifecycle and never executes repository code.</p></div>
        <div className="analyze-grid">
          <AnalyzeForm />
          <aside className="pipeline-panel">
            <div><p className="eyebrow">Analysis pipeline</p><h2>What happens next</h2></div>
            <ol>{steps.map(([title, description], index) => <li key={title}><span>{index + 1}</span><div><strong>{title}</strong><p>{description}</p></div></li>)}</ol>
          </aside>
        </div>
      </div>
    </main>
  );
}
