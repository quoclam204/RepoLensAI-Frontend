import { ProjectNavigation } from "@/components/project-navigation";
import { ApiExplorer } from "@/features/explorer/api-explorer";

export default async function ApiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="workspace-page"><div className="page-shell"><ProjectNavigation projectId={id} /><ApiExplorer analysisId={id} /></div></main>;
}
