"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { COURSE_DEPARTMENTS, getDepartmentCode } from "@/constants/courseOptions";
import {
  createCourseAdminAction,
  deleteCourseAdminAction,
  getCourseAdminAction,
  listCoursesAdminAction,
  updateCourseAdminAction,
  type CourseAdminFormState,
} from "@/lib/course/adminActions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type CourseWithStats } from "@/types/course";
import { CourseReviewsTable } from "@/components/admin/CourseReviewsTable";
import { type AdminCourseReviewListItem } from "@/types/admin";

type CoursesAdminPanelProps = {
  initialEditCourseId?: string | null;
  courseReviews?: AdminCourseReviewListItem[];
};

const PANEL_SECTIONS = [
  { id: "catalog", label: "课程目录" },
  { id: "reviews", label: "课程评价" },
] as const;

type PanelSectionId = (typeof PANEL_SECTIONS)[number]["id"];

const PAGE_SIZE = 20;
const initialState: CourseAdminFormState = {};

const TEXTAREA_CLASS =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function CourseForm({
  mode,
  course,
  onCancel,
  onDeleted,
}: {
  mode: "create" | "edit";
  course?: CourseWithStats;
  onCancel: () => void;
  onDeleted?: () => void;
}) {
  const action =
    mode === "edit" && course
      ? updateCourseAdminAction.bind(null, course.id)
      : createCourseAdminAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [deleteState, setDeleteState] = useState<CourseAdminFormState>({});
  const [isDeleting, startDeleteTransition] = useTransition();

  useEffect(() => {
    if (state.success && mode === "edit") {
      onCancel();
    }
  }, [state.success, mode, onCancel]);

  function handleDelete() {
    if (!course) return;
    const confirmed = window.confirm(
      `确定删除课程 ${course.code}？若已有评价，删除可能失败。`,
    );
    if (!confirmed) return;

    startDeleteTransition(async () => {
      const result = await deleteCourseAdminAction(course.id);
      setDeleteState(result);
      if (result.success) onDeleted?.();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "新增课程" : "编辑课程"}</CardTitle>
        <CardDescription>
          维护课程代码、名称与官方信息。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">课程代码</Label>
              <Input
                id="code"
                name="code"
                defaultValue={course?.code ?? ""}
                required
              />
              <FieldError message={state.fieldErrors?.code} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">院系</Label>
              <select
                id="department"
                name="department"
                defaultValue={course?.department ?? ""}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  请选择
                </option>
                {course?.department === "bba" ? (
                  <option value="bba">商学院 (其他)（历史分类）</option>
                ) : null}
                {COURSE_DEPARTMENTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors?.department} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">课程名称</Label>
            <Input
              id="name"
              name="name"
              defaultValue={course?.name ?? ""}
              required
            />
            <FieldError message={state.fieldErrors?.name} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty（可选）</Label>
              <Input id="faculty" name="faculty" defaultValue={course?.faculty ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level（可选）</Label>
              <Input id="level" name="level" defaultValue={course?.level ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Credits（可选）</Label>
              <Input
                id="credits"
                name="credits"
                type="number"
                step="0.5"
                defaultValue={course?.credits ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="semesterOffered">开课学期（可选）</Label>
            <Input
              id="semesterOffered"
              name="semesterOffered"
              defaultValue={course?.semesterOffered ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">课程目标（可选）</Label>
            <textarea
              id="objectives"
              name="objectives"
              rows={3}
              defaultValue={course?.objectives ?? ""}
              className={TEXTAREA_CLASS}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prerequisites">先修要求（可选）</Label>
            <textarea
              id="prerequisites"
              name="prerequisites"
              rows={2}
              defaultValue={course?.prerequisites ?? ""}
              className={TEXTAREA_CLASS}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teachingPattern">授课形式（可选）</Label>
            <Input
              id="teachingPattern"
              name="teachingPattern"
              defaultValue={course?.teachingPattern ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">课程简介（可选）</Label>
            <textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={course?.description ?? ""}
              placeholder="可选：补充课程说明或备注"
              className={TEXTAREA_CLASS}
            />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          {deleteState.error ? (
            <p className="text-sm text-destructive">{deleteState.error}</p>
          ) : null}
          {state.success ? (
            <p className="text-sm text-green-600">{state.success}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "保存中..." : mode === "create" ? "创建课程" : "保存修改"}
            </Button>
            {mode === "edit" && course ? (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? "删除中..." : "删除课程"}
                </Button>
              </>
            ) : null}
            <Button type="button" variant="outline" onClick={onCancel}>
              返回列表
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CoursesAdminPanel({
  initialEditCourseId = null,
  courseReviews = [],
}: CoursesAdminPanelProps) {
  const [panelSection, setPanelSection] = useState<PanelSectionId>("catalog");
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<CourseWithStats | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CourseWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, startLoadTransition] = useTransition();
  const [listVersion, setListVersion] = useState(0);

  const reloadList = useCallback(() => {
    startLoadTransition(async () => {
      const result = await listCoursesAdminAction({
        page,
        pageSize: PAGE_SIZE,
        search,
      });
      if (!result.success) {
        setLoadError(result.error);
        setItems([]);
        setTotal(0);
        setTotalPages(0);
        return;
      }
      setLoadError(null);
      setItems(result.data.items);
      setTotal(result.data.total);
      setTotalPages(result.data.totalPages);
      if (result.data.totalPages > 0 && page > result.data.totalPages) {
        setPage(result.data.totalPages);
      }
    });
  }, [page, search]);

  useEffect(() => {
    if (view === "list") {
      reloadList();
    }
  }, [view, reloadList, listVersion]);

  useEffect(() => {
    if (!initialEditCourseId) return;
    startLoadTransition(async () => {
      const result = await getCourseAdminAction(initialEditCourseId);
      if (result.success && result.course) {
        setEditing(result.course);
        setView("edit");
      }
    });
  }, [initialEditCourseId]);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function backToList(refresh = true) {
    setView("list");
    setEditing(null);
    if (refresh) {
      setListVersion((value) => value + 1);
    }
  }

  if (view === "create") {
    return (
      <CourseForm
        mode="create"
        onCancel={() => backToList(true)}
      />
    );
  }

  if (view === "edit" && editing) {
    return (
      <CourseForm
        mode="edit"
        course={editing}
        onCancel={() => backToList(true)}
        onDeleted={() => backToList(true)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-1">
        {PANEL_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setPanelSection(section.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              panelSection === section.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>

      {panelSection === "reviews" ? (
        <CourseReviewsTable reviews={courseReviews} />
      ) : (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>课程目录</CardTitle>
          <CardDescription>
            共 {total} 门课程 · 每页 {PAGE_SIZE} 门
            {search ? ` · 搜索「${search}」` : ""}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setView("create")}>
            新增课程
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="搜索课号、名称或院系…"
            className="max-w-md"
          />
          <Button type="submit" variant="secondary" disabled={isLoading}>
            搜索
          </Button>
          {search ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
            >
              清除
            </Button>
          ) : null}
        </form>

        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-2 py-2 font-medium">代码</th>
                <th className="px-2 py-2 font-medium">名称</th>
                <th className="px-2 py-2 font-medium">院系</th>
                <th className="px-2 py-2 font-medium">评价数</th>
                <th className="px-2 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((course) => (
                <tr key={course.id} className="border-b">
                  <td className="px-2 py-2 font-medium">{course.code}</td>
                  <td className="px-2 py-2">{course.name}</td>
                  <td className="px-2 py-2">{getDepartmentCode(course.department)}</td>
                  <td className="px-2 py-2">{course.reviewCount}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(course);
                          setView("edit");
                        }}
                      >
                        编辑
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              加载中…
            </p>
          ) : null}
          {!isLoading && items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {total === 0 && !search ? "暂无课程，请先新增。" : "没有匹配的课程。"}
            </p>
          ) : null}
        </div>

        {totalPages > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              第 {page} / {totalPages} 页
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
              >
                下一页
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
      )}
    </div>
  );
}
