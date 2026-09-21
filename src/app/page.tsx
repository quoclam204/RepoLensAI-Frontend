import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="page-shell home-grid">
        <section>
          <p className="eyebrow">Frontend foundation</p>
          <h1>Understand repositories through evidence.</h1>
          <p className="lead">
            The independent RepoLens frontend is ready for feature development. Routes,
            API contracts and mock boundaries are established without importing backend code.
          </p>
          <div className="actions">
            <Link className="button primary" href="/analyze">Open Analyze</Link>
            <Link className="button secondary" href="/projects/demo-analysis/overview">View route shell</Link>
          </div>
        </section>
        <aside className="foundation-card">
          <span className="status-badge">Foundation ready</span>
          <h2>Monday deliverables</h2>
          <ul>
            <li>Independent Next.js repository</li>
            <li>Typed REST API boundary</li>
            <li>Mock adapter for parallel work</li>
            <li>All SRS route shells</li>
            <li>Shared navigation and visual system</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
