import { MODULE_REGISTRY } from "@/constants/modules";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CourseReviewForm } from "@/components/courses/CourseReviewForm";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { getCourseByCode } from "@/lib/db/courses";
import { canCreateInModule } from "@/lib/utils/permissions";

type CourseReviewPageProps = {
  params: Promise<{ courseCode: string }>;
};

export default async function CourseReviewPage({ params }: CourseReviewPageProps) {
  const { courseCode } = await params;
  const [user, course] = await Promise.all([
    getSessionUser(),
    getCourseByCode(courseCode),
  ]);

  if (!course) {
    notFound();
  }

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.courses.review(course.code))}`);
  }

  if (!canCreateInModule(user, "courses")) {
    return (
      <ModulePageShell
        title="撰写课程评价"
        description={`${course.code} · ${MODULE_REGISTRY.courses.label}`}
        actions={
          <Button variant="outline" asChild>
            <Link href={ROUTES.courses.detail(course.code)}>返回课程详情</Link>
          </Button>
        }
      >
        <div className="mx-auto max-w-md rounded-lg border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          当前账号无法发布课程评价。请使用理大邮箱登录，并确保账号未被限制。
        </div>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      title="撰写课程评价"
      description={`为 ${course.code.toUpperCase()} 撰写评价 · ${MODULE_REGISTRY.courses.label}`}
      actions={
        <Button variant="outline" asChild>
          <Link href={ROUTES.courses.detail(course.code)}>返回课程详情</Link>
        </Button>
      }
    >
      <CourseReviewForm courseCode={course.code} courseName={course.name} />
    </ModulePageShell>
  );
}
