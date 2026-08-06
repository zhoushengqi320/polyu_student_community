import { MODULE_REGISTRY } from "@/constants/modules";
import { ContentGuideList } from "@/components/content/ContentGuideViews";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ROUTES } from "@/constants/routes";
import { listContentGuides } from "@/lib/db/contentGuides";

export default async function StudyPage() {
  const result = await listContentGuides("study");

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.study.label}
      description={MODULE_REGISTRY.study.description}
    >
      <ContentGuideList
        items={result.data}
        detailHref={ROUTES.study.detail}
        emptyTitle="暂无学习指南"
        emptyDescription="选课策略、常用官网、Add & Drop、GPA 规则、考试安排与学术规范等内容将陆续上线。"
      />
    </ModulePageShell>
  );
}
