import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { getCourseByCode } from "@/lib/db/courses";

type CourseDetailPageProps = {
  params: Promise<{ courseCode: string }>;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseCode } = await params;
  const course = await getCourseByCode(courseCode);

  return (
    <ModulePageShell
      title={course?.name ?? courseCode.toUpperCase()}
      description={`${MODULE_REGISTRY.courses.label} · 课程详情`}
    />
  );
}
