import { ProjectNavigation } from "@/components/project-navigation";

export function RoutePlaceholder({
  projectId,
  eyebrow,
  title,
  description,
  endpoint,
}: {
  projectId: string;
  eyebrow: string;
  title: string;
  description: string;
  endpoint: string;
}) {
  return (
    <main className="workspace-page">
      <div className="page-shell">
        <ProjectNavigation projectId={projectId} />
        <section className="placeholder-panel">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="contract-row">
            <span>API contract</span>
            <code>{endpoint}</code>
          </div>
          <p className="scope-note">
            Route shell prepared on Monday. Feature logic is intentionally deferred to its scheduled implementation day.
          </p>
        </section>
      </div>
    </main>
  );
}
