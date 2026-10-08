"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/language-context";

export function ProjectNavigation({ projectId }: { projectId: string }) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const items = [
    [t("nav.overview"), "overview"],
    [t("nav.architecture"), "architecture"],
    [t("nav.workflow"), "workflow"],
    [t("nav.dependencies"), "dependencies"],
    [t("nav.apis"), "apis"],
    [t("nav.database"), "database"],
    [t("nav.files"), "files"],
    [t("nav.chat"), "chat"],
  ] as const;

  return (
    <nav className="project-nav" aria-label="Project sections">
      {items.map(([label, route]) => {
        const href = `/projects/${encodeURIComponent(projectId)}/${route}`;
        const isActive = pathname.endsWith(`/${route}`) || pathname.includes(`/${route}/`);
        return (
          <Link href={href} key={route} className={isActive ? "active" : ""}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
