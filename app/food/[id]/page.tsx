import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { getFoodPlaceById } from "@/lib/db/food";

type FoodDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FoodDetailPage({ params }: FoodDetailPageProps) {
  const { id } = await params;
  await getFoodPlaceById(id);

  return (
    <ModulePageShell
      title="美食详情"
      description={`${MODULE_REGISTRY.food.label} · 详情页`}
    />
  );
}
