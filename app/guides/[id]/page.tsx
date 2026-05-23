import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { getGuideById } from "@/lib/db/guides";

type GuideDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { id } = await params;
  await getGuideById(id);

  return (
    <ModulePageShell
      title="攻略详情"
      description={`${MODULE_REGISTRY.guides.label} · 详情页`}
    />
  );
}
