import { ProjectNavigation } from "@/components/project-navigation";
import { DatabaseExplorer } from "@/features/explorer/database-explorer";

export default async function DatabasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="workspace-page"><div className="page-shell"><ProjectNavigation projectId={id} /><DatabaseExplorer analysisId={id} /></div></main>;
}
