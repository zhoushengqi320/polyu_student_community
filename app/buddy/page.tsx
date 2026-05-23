import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { listBuddyPosts } from "@/lib/db/buddy";

export default async function BuddyPage() {
  const { total } = await listBuddyPosts();

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.buddy.label}
      description={MODULE_REGISTRY.buddy.description}
    >
      <p className="text-sm text-muted-foreground">
        当前找搭子帖子数：{total}（数据库接入后显示真实数据）
      </p>
    </ModulePageShell>
  );
}
