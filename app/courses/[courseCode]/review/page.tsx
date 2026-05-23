import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";

type CourseReviewPageProps = {
  params: Promise<{ courseCode: string }>;
};

export default async function CourseReviewPage({ params }: CourseReviewPageProps) {
  const { courseCode } = await params;

  return (
    <ModulePageShell
      title="撰写课程评价"
      description={`为 ${courseCode.toUpperCase()} 撰写评价 · ${MODULE_REGISTRY.courses.label}`}
    />
  );
}
