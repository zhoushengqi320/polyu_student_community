import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ResourcesView } from "@/components/resources/ResourcesView";
import { listResourceGroups } from "@/lib/db/resources";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function ResourcesPage() {
  const groups = await listResourceGroups();
  const dataSource = isSupabaseConfigured() ? "supabase" : "fallback";

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.resources.label}
      description={MODULE_REGISTRY.resources.description}
    >
      <ResourcesView groups={groups} dataSource={dataSource} />
    </ModulePageShell>
  );
}
