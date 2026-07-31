"use client";

import { useActionState, useState } from "react";
import { COURSE_DEPARTMENTS } from "@/constants/courseOptions";
import {
  createCourseAdminAction,
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
};

const initialState: CourseAdminFormState = {};

function CourseForm({
  mode,
  course,
  onCancel,
}: {
  mode: "create" | "edit";
  course?: CourseWithStats;
  onCancel: () => void;
}) {
  const action =
    mode === "edit" && course
      ? updateCourseAdminAction.bind(null, course.id)
      : createCourseAdminAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "新增课程" : "编辑课程"}</CardTitle>
        <CardDescription>
          维护课程代码、名称与基础官方信息，便于学生检索与评价。
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
              {state.fieldErrors?.code ? (
                <p className="text-sm text-destructive">{state.fieldErrors.code}</p>
              ) : null}
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
            <Label htmlFor="prerequisites">先修要求（可选）</Label>
            <textarea
              id="prerequisites"
              name="prerequisites"
              rows={2}
              defaultValue={course?.prerequisites ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              rows={4}
              defaultValue={course?.description ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          {state.success ? (
            <p className="text-sm text-green-600">{state.success}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "保存中..." : mode === "create" ? "创建课程" : "保存修改"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              返回列表
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CoursesAdminPanel({ courses }: CoursesAdminPanelProps) {
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = courses.find((item) => item.id === editingId) ?? null;

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
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>课程目录</CardTitle>
          <CardDescription>共 {courses.length} 门课程</CardDescription>
        </div>
        <Button type="button" onClick={() => setView("create")}>
          新增课程
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
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
            {courses.map((course) => (
              <tr key={course.id} className="border-b">
                <td className="px-2 py-2 font-medium">{course.code}</td>
                <td className="px-2 py-2">{course.name}</td>
                <td className="px-2 py-2">{course.department}</td>
                <td className="px-2 py-2">{course.reviewCount}</td>
                <td className="px-2 py-2">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            暂无课程，请先新增。
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
