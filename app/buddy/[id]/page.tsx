import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { getBuddyPostById } from "@/lib/db/buddy";

type BuddyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BuddyDetailPage({ params }: BuddyDetailPageProps) {
  const { id } = await params;
  await getBuddyPostById(id);

  return (
    <ModulePageShell
      title="找搭子详情"
      description={`${MODULE_REGISTRY.buddy.label} · 详情页`}
    />
  );
}
