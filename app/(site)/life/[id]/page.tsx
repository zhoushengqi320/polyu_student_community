import { notFound } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { ContentGuideDetailView } from "@/components/content/ContentGuideViews";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { getContentGuideById } from "@/lib/db/contentGuides";
import { ROUTES } from "@/constants/routes";

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
      back={{ href: ROUTES.life.list, label: "生活指南" }}
    >
      <ContentGuideDetailView guide={guide} />
    </ModulePageShell>
  );
}
