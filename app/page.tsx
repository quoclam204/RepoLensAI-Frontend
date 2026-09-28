export default function HomePage() {
  return (
    <section>
      <h1>RepoLens AI</h1>
      <p>
        Analyze a repository, then ask evidence-grounded questions about it.
      </p>
      <p>
        Start an analysis via <code>POST /api/analyses</code>, then open
        <code> /analyses/[id]</code> to continue.
      </p>
    </section>
  );
}
