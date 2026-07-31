import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { GuideList } from "@/components/guides/GuideList";
import { GUIDE_CATEGORIES } from "@/constants/guides";
import { getSessionUser } from "@/lib/auth/session";
import { listGuides } from "@/lib/db/guides";

type GuidesPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
  }>;
};

function isGuideCategory(value: string) {
  return GUIDE_CATEGORIES.some((item) => item.id === value);
}

export default async function GuidesPage({ searchParams }: GuidesPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || undefined;
  const category =
    params.category && isGuideCategory(params.category)
      ? params.category
      : undefined;
  const page = Number(params.page) || 1;
  const user = await getSessionUser();
  const result = await listGuides(
    {
      search: query,
      category,
      page,
    },
    user?.id,
  );

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.guides.label}
      description={MODULE_REGISTRY.guides.description}
    >
      <p className="mb-6 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
        本入口为开学季临时专题，非常驻模块；非开学季可在功能开关中关闭。
      </p>
      <GuideList result={result} query={query} category={category} />
    </ModulePageShell>
  );
}
