import Link from "next/link";
import { MODULE_REGISTRY } from "@/constants/modules";
import { FoodList } from "@/components/food/FoodList";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { Button } from "@/components/ui/button";
import { FOOD_AREAS, type FoodAreaId } from "@/constants/categories";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { listFoodPlaces } from "@/lib/db/food";
import { can } from "@/lib/utils/permissions";

type FoodPageProps = {
  searchParams: Promise<{
    q?: string;
    area?: string;
    page?: string;
  }>;
};

function parseArea(value?: string): FoodAreaId | undefined {
  if (!value) return undefined;
  return FOOD_AREAS.some((item) => item.id === value)
    ? (value as FoodAreaId)
    : undefined;
}

export default async function FoodPage({ searchParams }: FoodPageProps) {
  const params = await searchParams;
  const user = await getSessionUser();
  const area = parseArea(params.area);
  const search = params.q?.trim() || undefined;
  const page = Number(params.page ?? "1") || 1;
  const result = await listFoodPlaces({ area, search, page, pageSize: 12 });
  const canSubmit = can(user, "content:create:food");

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.food.label}
      description={MODULE_REGISTRY.food.description}
      actions={
        <Button asChild variant="outline">
          <Link href={canSubmit ? ROUTES.food.new : ROUTES.login}>
            {canSubmit ? "提交新地点" : "登录后提交"}
          </Link>
        </Button>
      }
    >
      <FoodList
        result={result}
        area={area}
        search={search}
        canSubmit={canSubmit}
      />
    </ModulePageShell>
  );
}
