import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { listCourses } from "@/lib/db/courses";

export default async function CoursesPage() {
  const { total } = await listCourses();

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.courses.label}
      description={MODULE_REGISTRY.courses.description}
    >
      <p className="text-sm text-muted-foreground">
        当前课程数：{total}（数据库接入后显示真实数据）
      </p>
    </ModulePageShell>
  );
}
