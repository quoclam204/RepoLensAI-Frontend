import { RoutePlaceholder } from "@/components/route-placeholder";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <RoutePlaceholder projectId={id} eyebrow="Visualization" title="Dependencies" description="The dependency graph is scheduled for Wednesday." endpoint="GET /api/analyses/{id}/dependencies" />; }
