"use client";

import { useActionState } from "react";
import {
  COURSE_MAX_REVIEW_TAGS,
  COURSE_REVIEW_TAGS,
} from "@/constants/courseOptions";
import {
  createCourseReviewAction,
  type CourseReviewFormState,
} from "@/lib/course/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CourseReviewFormProps = {
  courseCode: string;
  courseName: string;
};

const initialState: CourseReviewFormState = {};

function RatingSelect({
  id,
  name,
  label,
  error,
}: {
  id: string;
  name: string;
  label: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        required
        defaultValue=""
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="" disabled>
          请选择评分
        </option>
        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>
            {value} 分
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function CourseReviewForm({
  courseCode,
  courseName,
}: CourseReviewFormProps) {
  const boundAction = createCourseReviewAction.bind(null, courseCode);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>撰写课程评价</CardTitle>
        <CardDescription>
          {courseCode.toUpperCase()} · {courseName} · 20 秒分享你的真实体验
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <RatingSelect
              id="overallRating"
              name="overallRating"
              label="Overall Rating · 总体推荐度"
              error={state.fieldErrors?.overallRating}
            />
            <RatingSelect
              id="difficultyRating"
              name="difficultyRating"
              label="Difficulty · 课程难度"
              error={state.fieldErrors?.difficultyRating}
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <Label>课程标签（最多 {COURSE_MAX_REVIEW_TAGS} 个）</Label>
              <p className="text-xs text-muted-foreground">帮助同学快速判断这门课特点</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {COURSE_REVIEW_TAGS.map((tag) => (
                <label
                  key={tag}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag}
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  {tag}
                </label>
              ))}
            </div>
            {state.fieldErrors?.tags ? (
              <p className="text-sm text-destructive">{state.fieldErrors.tags}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewText">课程评价</Label>
            <textarea
              id="reviewText"
              name="reviewText"
              rows={8}
              required
              placeholder="请分享你的真实体验、课程特点、优缺点，以及是否推荐其他同学选择。"
              className="flex min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              defaultChecked
              value="true"
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isAnonymous" className="font-normal">
              匿名展示（管理员仍可追溯账号）
            </Label>
          </div>

          {state.error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "发布中..." : "发布评价"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
