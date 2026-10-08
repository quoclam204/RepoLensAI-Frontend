"use client";

import { AnalyzeForm } from "@/features/analysis/analyze-form";
import { useLanguage } from "@/i18n/language-context";

export default function AnalyzePage() {
  const { t, language } = useLanguage();

  const isVi = language === "vi";

  const steps = isVi
    ? [
        ["1. Thu thập", t("analyze.stageAcquiring")],
        ["2. Quét cấu trúc", t("analyze.stageScanning")],
        ["3. Phân tích mã", t("analyze.stageAnalyzing")],
        ["4. Lập chỉ mục", t("analyze.stageIndexing")],
        ["5. Hoàn tất", t("analyze.stageCompleted")],
      ]
    : [
        ["1. Acquire", t("analyze.stageAcquiring")],
        ["2. Scan", t("analyze.stageScanning")],
        ["3. Analyze", t("analyze.stageAnalyzing")],
        ["4. Index", t("analyze.stageIndexing")],
        ["5. Completed", t("analyze.stageCompleted")],
      ];

  return (
    <main className="workspace-page">
      <div className="page-shell">
        <div className="analyze-intro">
          <p className="eyebrow">{isVi ? "Phân tích kho mã nguồn mới" : "New repository analysis"}</p>
          <h1>{t("analyze.title")}</h1>
          <p>{t("analyze.subtitle")}</p>
        </div>
        <div className="analyze-grid">
          <AnalyzeForm />
          <aside className="pipeline-panel">
            <div>
              <p className="eyebrow">{t("analyze.pipelineTitle")}</p>
              <h2>{isVi ? "Các bước xử lý tự động" : "What happens next"}</h2>
            </div>
            <ol>
              {steps.map(([title, description], index) => (
                <li key={title}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </main>
  );
}
