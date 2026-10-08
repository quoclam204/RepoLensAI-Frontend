import { ProjectNavigation } from "@/components/project-navigation";
import { RepositoryGraph } from "@/features/graphs/repository-graph";

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <div className="page-shell graph-nav">
        <ProjectNavigation projectId={id} />
      </div>
      <RepositoryGraph analysisId={id} kind="workflow" />
    </>
  );
}
