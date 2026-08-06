import { MODULE_REGISTRY } from "@/constants/modules";
import { ContentGuideList } from "@/components/content/ContentGuideViews";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ROUTES } from "@/constants/routes";
import { listContentGuides } from "@/lib/db/contentGuides";

export default async function LifePage() {
  const result = await listContentGuides("life");

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.life.label}
      description={MODULE_REGISTRY.life.description}
    >
      <ContentGuideList
        items={result.data}
        detailHref={ROUTES.life.detail}
        emptyTitle="暂无生活指南"
        emptyDescription="电话卡、银行开户、八达通、医疗、交通与日常缴费等内容将陆续上线。"
      />
    </ModulePageShell>
  );
}
