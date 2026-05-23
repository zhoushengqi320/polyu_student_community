import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { listFoodPlaces } from "@/lib/db/food";

export default async function FoodPage() {
  const { total } = await listFoodPlaces();

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.food.label}
      description={MODULE_REGISTRY.food.description}
    >
      <p className="text-sm text-muted-foreground">
        当前美食推荐数：{total}（数据库接入后显示真实数据）
      </p>
    </ModulePageShell>
  );
}
