import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { CourseCard } from "@/components/courses/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  COURSE_DEPARTMENTS,
  COURSE_SORT_OPTIONS,
  type CourseSortId,
} from "@/constants/courseOptions";
import { ROUTES } from "@/constants/routes";
import { type PaginatedResult } from "@/types/common";
import { type CourseWithStats } from "@/types/course";

type CourseListProps = {
  result: PaginatedResult<CourseWithStats>;
  query?: string;
  department?: string;
  sort: CourseSortId;
  canReview: boolean;
};

function buildCoursesUrl(params: {
  q?: string;
  department?: string;
  sort?: CourseSortId;
  page?: number;
}) {
  const search = new URLSearchParams();

  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }
  if (params.department) {
    search.set("department", params.department);
  }
  if (params.sort && params.sort !== "code") {
    search.set("sort", params.sort);
  }
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }

  const query = search.toString();
  return query ? `${ROUTES.courses.list}?${query}` : ROUTES.courses.list;
}

export function CourseList({
  result,
  query,
  department,
  sort,
  canReview,
}: CourseListProps) {
  return (
    <div className="space-y-6">
      <form className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_180px_180px_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name="q"
            defaultValue={query}
            placeholder="搜索课程代码、名称或简介，例如 COMP1002"
            className="pl-9"
          />
        </div>
        <select
          name="department"
          defaultValue={department ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">全部部门</option>
          {COURSE_DEPARTMENTS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {COURSE_SORT_OPTIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <Button type="submit">搜索</Button>
      </form>

      {result.data.length === 0 ? (
        <EmptyState
          title="没有找到课程"
          description="试试更换课程代码、关键词或清除筛选条件。"
          action={
            query || department || sort !== "code" ? (
              <Button asChild variant="outline">
                <Link href={ROUTES.courses.list}>清除筛选</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {result.data.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                canReview={canReview}
              />
            ))}
          </div>

          {result.total > result.pageSize ? (
            <div className="flex justify-center gap-2">
              {result.page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={buildCoursesUrl({
                      q: query,
                      department,
                      sort,
                      page: result.page - 1,
                    })}
                  >
                    上一页
                  </Link>
                </Button>
              ) : null}
              <span className="flex items-center text-sm text-muted-foreground">
                第 {result.page} 页 · 共 {result.total} 门课程
              </span>
              {result.hasMore ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={buildCoursesUrl({
                      q: query,
                      department,
                      sort,
                      page: result.page + 1,
                    })}
                  >
                    下一页
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
