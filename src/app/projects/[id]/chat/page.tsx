import { ProjectNavigation } from "@/components/project-navigation";
import { RepositoryChat } from "@/features/chat/repository-chat";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="workspace-page"><div className="page-shell"><ProjectNavigation projectId={id} /><RepositoryChat analysisId={id} /></div></main>;
}
