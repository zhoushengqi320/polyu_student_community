import { notFound } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { CourseDetailView } from "@/components/courses/CourseDetailView";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { getSessionUser } from "@/lib/auth/session";
import { getCourseDetailByCode } from "@/lib/db/courses";
import { hasReaction } from "@/lib/db/reactions";
import { TARGET_TYPES } from "@/constants/reportReasons";

type CourseDetailPageProps = {
  params: Promise<{ courseCode: string }>;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseCode } = await params;
  const user = await getSessionUser();
  const course = await getCourseDetailByCode(courseCode, user?.id);

  if (!course) {
    notFound();
  }

  const isFavorited =
    user && course
      ? await hasReaction({
          userId: user.id,
          targetType: TARGET_TYPES.course,
          targetId: course.id,
          type: "favorite",
        })
      : false;

  return (
    <ModulePageShell
      title={course.name}
      description={`${MODULE_REGISTRY.courses.label} · 课程详情`}
      back={{ href: "/courses", label: MODULE_REGISTRY.courses.label }}
    >
      <CourseDetailView
        course={course}
        user={user}
        isFavorited={isFavorited}
        currentUserId={user?.id ?? null}
      />
    </ModulePageShell>
  );
}
