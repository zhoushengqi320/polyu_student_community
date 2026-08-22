import Link from "next/link";
import { MODULE_REGISTRY } from "@/constants/modules";
import { FoodList } from "@/components/food/FoodList";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { Button } from "@/components/ui/button";
import { FOOD_AREAS, type FoodAreaId } from "@/constants/categories";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { getModuleCreatePrompt } from "@/lib/utils/authPrompts";
import { listFoodPlaces } from "@/lib/db/food";

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
  const submitPrompt = getModuleCreatePrompt(
    user,
    "food",
    {
      login: "登录后提交",
      banned: "账号受限",
      unverified: "认证后提交",
    },
    ROUTES.food.new,
  );
  const canSubmit = !submitPrompt;

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.food.label}
      description={MODULE_REGISTRY.food.description}
      back={{ href: "/", label: "首页" }}
      actions={
        submitPrompt ? (
          <Button asChild variant="outline">
            <Link href={submitPrompt.href}>{submitPrompt.label}</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href={ROUTES.food.new}>提交新地点</Link>
          </Button>
        )
      }
    >
      <FoodList
        result={result}
        area={area}
        search={search}
        canSubmit={canSubmit}
        submitPrompt={submitPrompt}
      />
    </ModulePageShell>
  );
}
