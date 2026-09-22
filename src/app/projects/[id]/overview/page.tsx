import type { Metadata } from "next";
import { OverviewDashboard } from "@/features/analysis/overview-dashboard";

export const metadata: Metadata = { title: "Repository overview" };

export default async function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OverviewDashboard analysisId={id} />;
}
