import { RoutePlaceholder } from "@/components/route-placeholder";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoutePlaceholder projectId={id} eyebrow="Repository dashboard" title="Overview" description="Repository information, languages, projects, file statistics and analysis status will be implemented on Tuesday." endpoint="GET /api/analyses/{id}/overview" />;
}
