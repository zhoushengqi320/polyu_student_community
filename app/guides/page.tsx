import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { listGuides } from "@/lib/db/guides";

export default async function GuidesPage() {
  const { total } = await listGuides();

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.guides.label}
      description={MODULE_REGISTRY.guides.description}
    >
      <p className="text-sm text-muted-foreground">
        当前攻略数：{total}（数据库接入后显示真实数据）
      </p>
    </ModulePageShell>
  );
}
