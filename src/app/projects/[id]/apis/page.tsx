import { RoutePlaceholder } from "@/components/route-placeholder";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <RoutePlaceholder projectId={id} eyebrow="Repository explorer" title="API endpoints" description="Endpoint list and detail views are scheduled for Thursday." endpoint="GET /api/analyses/{id}/endpoints" />; }
