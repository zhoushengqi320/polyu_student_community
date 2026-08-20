import {
  PERMANENT_MODULES,
  SEASONAL_MODULES,
} from "@/constants/modules";
import { isFeatureEnabled } from "@/constants/features";
import { ModuleCard } from "@/components/common/ModuleCard";
import { HomeSectionShell } from "@/components/home/HomeSectionShell";

export function CoreModuleGrid() {
  const showSeasonalGuides = isFeatureEnabled("seasonalGuides");

  return (
    <div className="space-y-10">
      {showSeasonalGuides ? (
        <HomeSectionShell
          title="开学季专题"
          description="「入学攻略」为开学季临时板块，非常驻导航；非开学季可通过配置关闭。"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SEASONAL_MODULES.map((module) => (
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
      ) : null}

      <HomeSectionShell
        title="核心模块"
        description="课程评价、吃喝玩乐、学习指南、生活指南、自由讨论区（含找搭子）。"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERMANENT_MODULES.map((module) => (
            <ModuleCard
              key={module.key}
              moduleKey={module.key}
              route={module.route}
              label={module.label}
              description={module.description}
              icon={module.icon}
              tourId={`home-module-${module.key}`}
            />
          ))}
        </div>
      </HomeSectionShell>
    </div>
  );
}
