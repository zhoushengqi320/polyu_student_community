import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { CourseList } from "@/components/courses/CourseList";
import { COURSE_SORT_OPTIONS, type CourseSortId } from "@/constants/courseOptions";
import { getSessionUser } from "@/lib/auth/session";
import { listCourses } from "@/lib/db/courses";

type CoursesPageProps = {
  searchParams: Promise<{
    q?: string;
    department?: string;
    sort?: string;
    page?: string;
  }>;
};

function isCourseSortId(value: string): value is CourseSortId {
  return COURSE_SORT_OPTIONS.some((item) => item.id === value);
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || undefined;
  const department = params.department?.trim() || undefined;
  const sort =
    params.sort && isCourseSortId(params.sort) ? params.sort : "code";
  const page = Number(params.page) || 1;
  const [user, result] = await Promise.all([
    getSessionUser(),
    listCourses({ search: query, department, sort, page }),
  ]);

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.courses.label}
      description={MODULE_REGISTRY.courses.description}
      back={{ href: "/", label: "首页" }}
    >
      <CourseList
        result={result}
        query={query}
        department={department}
        sort={sort}
        user={user}
      />
    </ModulePageShell>
  );
}
