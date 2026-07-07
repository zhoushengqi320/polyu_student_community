import { notFound } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { GuideDetailView } from "@/components/guides/GuideDetailView";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { getSessionUser } from "@/lib/auth/session";
import { getGuideById } from "@/lib/db/guides";

type GuideDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  const guide = await getGuideById(id, user?.id);

  if (!guide) {
    notFound();
  }

  return (
    <ModulePageShell
      title={guide.title}
      description={`${MODULE_REGISTRY.guides.label} · 详情页`}
    >
      <GuideDetailView guide={guide} />
    </ModulePageShell>
  );
}
