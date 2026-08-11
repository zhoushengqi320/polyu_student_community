import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PagePagination } from "@/components/common/PagePagination";
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
            placeholder="搜索课程代码或名称，例如 AP、AP10000"
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

          <PagePagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            basePath={ROUTES.courses.list}
            query={{
              q: query,
              department,
              sort: sort === "code" ? undefined : sort,
            }}
          />
        </>
      )}
    </div>
  );
}
