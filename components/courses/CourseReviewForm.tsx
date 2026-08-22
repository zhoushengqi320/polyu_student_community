"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  COURSE_ASSIGNMENT_TYPES,
  COURSE_ATTENDANCE_OPTIONS,
  COURSE_EXAM_TYPES,
  COURSE_REVIEW_TAGS,
  COURSE_SEMESTERS,
  getConflictingReviewTag,
  getCourseRatingDimension,
  getRecentAcademicYears,
  type CourseReviewTag,
} from "@/constants/courseOptions";
import { ROUTES } from "@/constants/routes";
import {
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from "@/components/common/UnsavedChangesGuard";
import { PendingOverlay } from "@/components/common/PendingOverlay";
import { StarRatingInput } from "@/components/courses/StarRatingInput";
import {
  createCourseReviewAction,
  type CourseReviewFormState,
} from "@/lib/course/actions";
import { cn } from "@/lib/utils/cn";
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
import { CommunityRulesNotice } from "@/components/legal/CommunityRulesNotice";

type CourseReviewFormProps = {
  courseCode: string;
  courseName: string;
};

const initialState: CourseReviewFormState = {};

const fieldClassName = (hasError?: boolean) =>
  cn(
    "flex w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    hasError
      ? "border-destructive focus-visible:ring-destructive"
      : "border-input",
  );

function toggleExclusiveOption(
  current: string[],
  optionId: string,
  exclusiveIds: readonly string[] = ["none"],
) {
  if (current.includes(optionId)) {
    return current.filter((item) => item !== optionId);
  }

  if (exclusiveIds.includes(optionId)) {
    return [optionId];
  }

  return [...current.filter((item) => !exclusiveIds.includes(item)), optionId];
}

export function CourseReviewForm({
  courseCode,
  courseName,
}: CourseReviewFormProps) {
  const router = useRouter();
  const boundAction = createCourseReviewAction.bind(null, courseCode);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const { markDirty, confirmLeave, dialogProps } = useUnsavedChangesGuard();

  const academicYears = getRecentAcademicYears();
  const [academicYear, setAcademicYear] = useState("");
  const [semesterTerm, setSemesterTerm] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [workloadRating, setWorkloadRating] = useState(0);
  const [gradingRating, setGradingRating] = useState(0);
  const [teachingRating, setTeachingRating] = useState(0);
  const [examDifficulty, setExamDifficulty] = useState(0);
  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [examTypeOther, setExamTypeOther] = useState("");
  const [assignmentTypes, setAssignmentTypes] = useState<string[]>([]);
  const [attendanceRequired, setAttendanceRequired] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [tagHint, setTagHint] = useState<string | null>(null);

  useEffect(() => {
    if (!state.values) return;
    setAcademicYear(state.values.academicYear);
    setSemesterTerm(state.values.semesterTerm);
    setTeacherName(state.values.teacherName);
    setOverallRating(Number(state.values.overallRating) || 0);
    setDifficultyRating(Number(state.values.difficultyRating) || 0);
    setWorkloadRating(Number(state.values.workloadRating) || 0);
    setGradingRating(Number(state.values.gradingRating) || 0);
    setTeachingRating(Number(state.values.teachingRating) || 0);
    setExamDifficulty(Number(state.values.examDifficulty) || 0);
    setExamTypes(state.values.examTypes);
    setExamTypeOther(state.values.examTypeOther);
    setAssignmentTypes(state.values.assignmentTypes);
    setAttendanceRequired(state.values.attendanceRequired);
    setSelectedTags(state.values.tags);
    setReviewText(state.values.reviewText);
    setIsAnonymous(state.values.isAnonymous);
  }, [state.values]);

  function updateField<T>(setter: (value: T) => void, value: T) {
    markDirty();
    setter(value);
  }

  function toggleTag(tag: CourseReviewTag) {
    setTagHint(null);
    markDirty();
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((item) => item !== tag);
      }

      const conflicting = getConflictingReviewTag(tag);
      if (conflicting && prev.includes(conflicting)) {
        setTagHint(`「${tag}」与「${conflicting}」不能同时选择，已替换为「${tag}」`);
        return [...prev.filter((item) => item !== conflicting), tag];
      }

      return [...prev, tag];
    });
  }

  return (
    <>
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>撰写课程评价</CardTitle>
          <CardDescription>
            {courseCode.toUpperCase()} · {courseName} · 结构化信息帮助同学选课决策
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">修读信息</h3>
                <p className="text-xs text-muted-foreground">
                  学期与教师能显著提高评价参考价值
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">修读学年</Label>
                  <select
                    id="academicYear"
                    name="academicYear"
                    required
                    value={academicYear}
                    onChange={(event) =>
                      updateField(setAcademicYear, event.target.value)
                    }
                    className={cn(
                      fieldClassName(Boolean(state.fieldErrors?.academicYear)),
                      "h-10",
                    )}
                  >
                    <option value="" disabled>
                      请选择学年
                    </option>
                    {academicYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                    <option value="unknown">不确定</option>
                  </select>
                  {state.fieldErrors?.academicYear ? (
                    <p className="text-sm text-destructive">
                      {state.fieldErrors.academicYear}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semesterTerm">修读学期</Label>
                  <select
                    id="semesterTerm"
                    name="semesterTerm"
                    required
                    value={semesterTerm}
                    onChange={(event) =>
                      updateField(setSemesterTerm, event.target.value)
                    }
                    className={cn(
                      fieldClassName(Boolean(state.fieldErrors?.semesterTerm)),
                      "h-10",
                    )}
                  >
                    <option value="" disabled>
                      请选择学期
                    </option>
                    {COURSE_SEMESTERS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {state.fieldErrors?.semesterTerm ? (
                    <p className="text-sm text-destructive">
                      {state.fieldErrors.semesterTerm}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacherName">授课教师（可选）</Label>
                <Input
                  id="teacherName"
                  name="teacherName"
                  value={teacherName}
                  onChange={(event) =>
                    updateField(setTeacherName, event.target.value)
                  }
                  placeholder="例如：Chan Tai Man"
                  maxLength={80}
                />
                {state.fieldErrors?.teacherName ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.teacherName}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">核心评分</h3>
                <p className="text-xs text-muted-foreground">
                  按住星星左右滑动，或直接点击给分
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <StarRatingInput
                  id="overallRating"
                  name="overallRating"
                  label={getCourseRatingDimension("overall").label}
                  optionLabels={getCourseRatingDimension("overall").optionLabels}
                  value={overallRating}
                  onChange={(value) => updateField(setOverallRating, value)}
                  error={state.fieldErrors?.overallRating}
                />
                <StarRatingInput
                  id="difficultyRating"
                  name="difficultyRating"
                  label={getCourseRatingDimension("difficulty").label}
                  optionLabels={
                    getCourseRatingDimension("difficulty").optionLabels
                  }
                  value={difficultyRating}
                  onChange={(value) => updateField(setDifficultyRating, value)}
                  error={state.fieldErrors?.difficultyRating}
                />
                <StarRatingInput
                  id="workloadRating"
                  name="workloadRating"
                  label={getCourseRatingDimension("workload").label}
                  optionLabels={getCourseRatingDimension("workload").optionLabels}
                  value={workloadRating}
                  onChange={(value) => updateField(setWorkloadRating, value)}
                  error={state.fieldErrors?.workloadRating}
                />
                <StarRatingInput
                  id="gradingRating"
                  name="gradingRating"
                  label={getCourseRatingDimension("grading").label}
                  optionLabels={getCourseRatingDimension("grading").optionLabels}
                  value={gradingRating}
                  onChange={(value) => updateField(setGradingRating, value)}
                  error={state.fieldErrors?.gradingRating}
                />
                <StarRatingInput
                  id="teachingRating"
                  name="teachingRating"
                  label={getCourseRatingDimension("teaching").label}
                  optionLabels={getCourseRatingDimension("teaching").optionLabels}
                  value={teachingRating}
                  onChange={(value) => updateField(setTeachingRating, value)}
                  error={state.fieldErrors?.teachingRating}
                />
                <StarRatingInput
                  id="examDifficulty"
                  name="examDifficulty"
                  label={getCourseRatingDimension("examDifficulty").label}
                  optionLabels={
                    getCourseRatingDimension("examDifficulty").optionLabels
                  }
                  value={examDifficulty}
                  onChange={(value) => updateField(setExamDifficulty, value)}
                  error={state.fieldErrors?.examDifficulty}
                  required={false}
                />
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">考核与出勤（可选）</h3>
              </div>

              <div className="space-y-2">
                <Label>考试形式（可多选）</Label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_EXAM_TYPES.map((item) => {
                    const checked = examTypes.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                          checked
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input bg-background hover:bg-muted",
                        )}
                      >
                        <input
                          type="checkbox"
                          name="examTypes"
                          value={item.id}
                          checked={checked}
                          onChange={() => {
                            const next = toggleExclusiveOption(
                              examTypes,
                              item.id,
                            );
                            updateField(setExamTypes, next);
                            if (!next.includes("other")) {
                              setExamTypeOther("");
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-input"
                        />
                        {item.label}
                      </label>
                    );
                  })}
                </div>
                {examTypes.includes("other") ? (
                  <div className="pt-1">
                    <input
                      id="examTypeOther"
                      name="examTypeOther"
                      value={examTypeOther}
                      onChange={(event) =>
                        updateField(setExamTypeOther, event.target.value)
                      }
                      placeholder="请输入其他考试形式"
                      maxLength={80}
                      className={cn(
                        "w-full max-w-md border-0 border-b bg-transparent px-0 py-1.5 text-sm rounded-none shadow-none focus-visible:outline-none focus-visible:ring-0",
                        state.fieldErrors?.examTypeOther
                          ? "border-destructive"
                          : "border-input focus:border-foreground",
                      )}
                      aria-invalid={Boolean(state.fieldErrors?.examTypeOther)}
                    />
                    {state.fieldErrors?.examTypeOther ? (
                      <p className="mt-1 text-sm text-destructive">
                        {state.fieldErrors.examTypeOther}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <input type="hidden" name="examTypeOther" value="" />
                )}
                {state.fieldErrors?.examType ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.examType}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>作业形式（可多选）</Label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_ASSIGNMENT_TYPES.map((item) => {
                    const checked = assignmentTypes.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                          checked
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input bg-background hover:bg-muted",
                        )}
                      >
                        <input
                          type="checkbox"
                          name="assignmentTypes"
                          value={item.id}
                          checked={checked}
                          onChange={() =>
                            updateField(
                              setAssignmentTypes,
                              toggleExclusiveOption(assignmentTypes, item.id),
                            )
                          }
                          className="h-3.5 w-3.5 rounded border-input"
                        />
                        {item.label}
                      </label>
                    );
                  })}
                </div>
                {state.fieldErrors?.assignmentType ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.assignmentType}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>出勤要求（可选）</Label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_ATTENDANCE_OPTIONS.map((item) => {
                    const checked = attendanceRequired === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          updateField(
                            setAttendanceRequired,
                            checked ? "" : item.id,
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition-colors",
                          checked
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input bg-background hover:bg-muted",
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" name="attendanceRequired" value={attendanceRequired} />
                {state.fieldErrors?.attendanceRequired ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.attendanceRequired}
                  </p>
                ) : null}
              </div>
            </section>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label>课程标签（可多选；相反标签不能同时选）</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    帮助同学快速判断这门课特点
                  </p>
                </div>
                {selectedTags.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setTagHint(null);
                      updateField(setSelectedTags, []);
                    }}
                  >
                    清空已选（{selectedTags.length}）
                  </Button>
                ) : null}
              </div>
              <div
                className={cn(
                  "flex flex-wrap gap-2 rounded-md border p-3",
                  state.fieldErrors?.tags
                    ? "border-destructive"
                    : "border-transparent",
                )}
              >
                {COURSE_REVIEW_TAGS.map((tag) => {
                  const checked = selectedTags.includes(tag);
                  const conflicting = getConflictingReviewTag(tag);
                  const blockedByOpposite =
                    Boolean(conflicting) &&
                    selectedTags.includes(conflicting!) &&
                    !checked;

                  return (
                    <label
                      key={tag}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        checked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-background hover:bg-muted",
                        blockedByOpposite && "opacity-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        name="tags"
                        value={tag}
                        checked={checked}
                        onChange={() => toggleTag(tag)}
                        className="h-3.5 w-3.5 rounded border-input"
                      />
                      {tag}
                    </label>
                  );
                })}
              </div>
              {tagHint ? (
                <p className="text-sm text-amber-700">{tagHint}</p>
              ) : null}
              {state.fieldErrors?.tags ? (
                <p className="text-sm text-destructive">{state.fieldErrors.tags}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewText">课程体验 / Tips（可选）</Label>
              <textarea
                id="reviewText"
                name="reviewText"
                rows={7}
                value={reviewText}
                onChange={(event) =>
                  updateField(setReviewText, event.target.value)
                }
                placeholder="可写真实体验、考核重点、优缺点，或避坑 Tips（例如作业要尽早开始、期末重点看 lecture notes）"
                className={cn(
                  fieldClassName(Boolean(state.fieldErrors?.reviewText)),
                  "min-h-36",
                )}
                aria-invalid={Boolean(state.fieldErrors?.reviewText)}
              />
              {state.fieldErrors?.reviewText ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.reviewText}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <input type="hidden" name="isAnonymous" value="false" />
              <input
                id="isAnonymous"
                name="isAnonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={(event) =>
                  updateField(setIsAnonymous, event.target.checked)
                }
                value="true"
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isAnonymous" className="font-normal">
                匿名展示
              </Label>
            </div>

            {state.error ? (
              <p
                className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {state.error}
              </p>
            ) : null}

            <CommunityRulesNotice message="发布课程评价前请遵守社区规则，分享真实体验，勿人身攻击或泄露隐私。" />

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "发布中..." : "发布评价"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  confirmLeave(() => {
                    router.push(ROUTES.courses.detail(courseCode));
                  })
                }
              >
                返回课程详情
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <PendingOverlay active={pending} label="发布中…" />
      <UnsavedChangesDialog {...dialogProps} />
    </>
  );
}
