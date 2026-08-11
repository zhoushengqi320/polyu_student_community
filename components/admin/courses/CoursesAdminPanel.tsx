"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { COURSE_DEPARTMENTS } from "@/constants/courseOptions";
import { ROUTES } from "@/constants/routes";
import {
  createCourseAdminAction,
  deleteCourseAdminAction,
  updateCourseAdminAction,
  type CourseAdminFormState,
} from "@/lib/course/adminActions";
import { Button } from "@/components/ui/button";
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

type CoursesAdminPanelProps = {
  courses: CourseWithStats[];
  initialEditCourseId?: string | null;
};

const initialState: CourseAdminFormState = {};

const TEXTAREA_CLASS =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function FieldError({
  message,
}: {
  message?: string;
}) {
  if (!message) {
    return null;
  }
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
    if (!course) {
      return;
    }
    const confirmed = window.confirm(
      `确定删除课程 ${course.code}？若已有评价，删除可能失败。`,
    );
    if (!confirmed) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteCourseAdminAction(course.id);
      setDeleteState(result);
      if (result.success) {
        onDeleted?.();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "新增课程" : "编辑课程"}</CardTitle>
        <CardDescription>
          维护课程代码、名称与官方信息。合并 PDF 拆分后可在描述中注明与哪些课号共用大纲。
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
              <FieldError message={state.fieldErrors?.faculty} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level（可选）</Label>
              <Input id="level" name="level" defaultValue={course?.level ?? ""} />
              <FieldError message={state.fieldErrors?.level} />
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
              <FieldError message={state.fieldErrors?.credits} />
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
            <FieldError message={state.fieldErrors?.objectives} />
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
            <FieldError message={state.fieldErrors?.prerequisites} />
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
              placeholder="合并 PDF 拆分时，可在此注明：本课程与 XXX 共用同一份官方大纲。"
              className={TEXTAREA_CLASS}
            />
            <FieldError message={state.fieldErrors?.description} />
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
                <Button type="button" variant="outline" asChild>
                  <Link href={ROUTES.courses.detail(course.code)}>查看课程页</Link>
                </Button>
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
  courses,
  initialEditCourseId = null,
}: CoursesAdminPanelProps) {
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(initialEditCourseId);
  const [search, setSearch] = useState("");
  const editing = courses.find((item) => item.id === editingId) ?? null;

  useEffect(() => {
    if (initialEditCourseId) {
      setEditingId(initialEditCourseId);
      setView("edit");
    }
  }, [initialEditCourseId]);

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return courses;
    }
    return courses.filter(
      (course) =>
        course.code.toLowerCase().includes(keyword) ||
        course.name.toLowerCase().includes(keyword) ||
        course.department.toLowerCase().includes(keyword),
    );
  }, [courses, search]);

  if (view === "create") {
    return <CourseForm mode="create" onCancel={() => setView("list")} />;
  }

  if (view === "edit" && editing) {
    return (
      <CourseForm
        mode="edit"
        course={editing}
        onCancel={() => {
          setView("list");
          setEditingId(null);
        }}
        onDeleted={() => {
          setView("list");
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>课程目录</CardTitle>
          <CardDescription>
            共 {courses.length} 门课程
            {search.trim() ? ` · 筛选后 ${filteredCourses.length} 门` : ""}
          </CardDescription>
        </div>
        <Button type="button" onClick={() => setView("create")}>
          新增课程
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索课号、名称或院系…"
        />
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
              {filteredCourses.map((course) => (
                <tr key={course.id} className="border-b">
                  <td className="px-2 py-2 font-medium">{course.code}</td>
                  <td className="px-2 py-2">{course.name}</td>
                  <td className="px-2 py-2">{course.department}</td>
                  <td className="px-2 py-2">{course.reviewCount}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(course.id);
                          setView("edit");
                        }}
                      >
                        编辑
                      </Button>
                      <Button type="button" size="sm" variant="ghost" asChild>
                        <Link href={ROUTES.courses.detail(course.code)}>查看</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCourses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {courses.length === 0 ? "暂无课程，请先新增。" : "没有匹配的课程。"}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
