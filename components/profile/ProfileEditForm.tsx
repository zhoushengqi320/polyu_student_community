"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  updateOwnProfileAction,
  type OnboardingFormState,
} from "@/lib/profile/actions";
import { STUDENT_GRADES } from "@/constants/profileOptions";
import { PROFILE_REVIEW_STATUS_LABELS } from "@/constants/profileReview";
import { type Profile } from "@/types/user";
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

const initialState: OnboardingFormState = {};

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(
    updateOwnProfileAction,
    initialState,
  );

  const previewAvatar =
    profile.pendingAvatarUrl || profile.approvedAvatarUrl || profile.avatarUrl;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>修改昵称与头像</CardTitle>
        <CardDescription>
          当前审核状态：
          {PROFILE_REVIEW_STATUS_LABELS[profile.profileReviewStatus]}
          {profile.reviewReason ? `（驳回理由：${profile.reviewReason}）` : ""}
          。提交后将重新进入审核；审核通过前全站展示默认昵称与头像。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
              {previewAvatar ? (
                <Image
                  src={previewAvatar}
                  alt="头像预览"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>公开展示：{profile.displayName}</p>
              {profile.nickname ? <p>待审昵称：{profile.nickname}</p> : null}
              {profile.pendingAvatarUrl &&
              profile.profileReviewStatus === "pending" ? (
                <p className="text-xs">已上传头像，等待审核</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">昵称</Label>
            <Input
              id="nickname"
              name="nickname"
              defaultValue={profile.nickname ?? profile.approvedNickname ?? ""}
              maxLength={30}
              placeholder="2–30 个字符，留空表示不修改"
            />
            {state.fieldErrors?.nickname ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.nickname}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">上传新头像（JPG / PNG / WebP，≤2MB）</Label>
            <Input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
          </div>

          <details className="rounded-md border px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium">
              年级与专业（修改后直接生效，无需审核）
            </summary>
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="grade">年级</Label>
                <select
                  id="grade"
                  name="grade"
                  defaultValue={profile.grade ?? ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">不修改</option>
                  {STUDENT_GRADES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.grade ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.grade}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">专业</Label>
                <Input
                  id="major"
                  name="major"
                  defaultValue={profile.major ?? ""}
                  placeholder="留空表示不修改"
                />
                {state.fieldErrors?.major ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.major}
                  </p>
                ) : null}
              </div>
            </div>
          </details>

          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="text-sm text-green-700">{state.success}</p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "提交中..." : "保存并提交审核"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
