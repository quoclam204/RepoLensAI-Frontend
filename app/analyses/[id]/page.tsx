type AnalysesPageProps = {
  params: { id: string };
};

/**
 * Per-analysis container route. Feature teams build analysis/chat UI here.
 * Deliberately minimal: only exposes the analysis id from the URL.
 */
export default function AnalysisDetailPage({ params }: AnalysesPageProps) {
  return (
    <section>
      <h1>Analysis</h1>
      <p>
        Analysis id: <code>{params.id}</code>
      </p>
    </section>
  );
}
