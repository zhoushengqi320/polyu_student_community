import { CORE_MODULES } from "@/constants/modules";
import { ModuleCard } from "@/components/common/ModuleCard";
import { HomeSectionShell } from "@/components/home/HomeSectionShell";

export function CoreModuleGrid() {
  return (
    <HomeSectionShell
      title="六大核心模块"
      description="课程评价、入学攻略、讨论区、常用网站、找搭子、美食推荐。"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CORE_MODULES.map((module) => (
          <ModuleCard
            key={module.key}
            moduleKey={module.key}
            route={module.route}
            label={module.label}
            description={module.description}
            icon={module.icon}
          />
        ))}
      </div>
    </HomeSectionShell>
  );
}
