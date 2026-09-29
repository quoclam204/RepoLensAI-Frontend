import { ProjectNavigation } from "@/components/project-navigation";
import { FileExplorer } from "@/features/explorer/file-explorer";

export default async function FilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="workspace-page"><div className="page-shell"><ProjectNavigation projectId={id} /><FileExplorer analysisId={id} /></div></main>;
}
