import Link from "next/link";

const items = [
  ["Overview", "overview"],
  ["Architecture", "architecture"],
  ["Dependencies", "dependencies"],
  ["APIs", "apis"],
  ["Database", "database"],
  ["Files", "files"],
  ["Chat", "chat"],
] as const;

export function ProjectNavigation({ projectId }: { projectId: string }) {
  return (
    <nav className="project-nav" aria-label="Project sections">
      {items.map(([label, route]) => (
        <Link href={`/projects/${encodeURIComponent(projectId)}/${route}`} key={route}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
