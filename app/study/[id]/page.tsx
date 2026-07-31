import { notFound } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { ContentGuideDetailView } from "@/components/content/ContentGuideViews";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { getContentGuideById } from "@/lib/db/contentGuides";

type StudyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudyDetailPage({ params }: StudyDetailPageProps) {
  const { id } = await params;
  const guide = await getContentGuideById("study", id);

  if (!guide) {
    notFound();
  }

  return (
    <ModulePageShell
      title={guide.title}
      description={`${MODULE_REGISTRY.study.label} · 详情页`}
    >
      <ContentGuideDetailView guide={guide} />
    </ModulePageShell>
  );
}
