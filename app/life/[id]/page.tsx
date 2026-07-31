import { notFound } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { ContentGuideDetailView } from "@/components/content/ContentGuideViews";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { getContentGuideById } from "@/lib/db/contentGuides";

type LifeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LifeDetailPage({ params }: LifeDetailPageProps) {
  const { id } = await params;
  const guide = await getContentGuideById("life", id);

  if (!guide) {
    notFound();
  }

  return (
    <ModulePageShell
      title={guide.title}
      description={`${MODULE_REGISTRY.life.label} · 详情页`}
    >
      <ContentGuideDetailView guide={guide} />
    </ModulePageShell>
  );
}
