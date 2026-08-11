"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  updateOwnProfileAction,
  uploadAvatarAction,
  type OnboardingFormState,
} from "@/lib/profile/actions";
import { STUDENT_GRADES } from "@/constants/profileOptions";
import {
  PROFILE_REVIEW_STATUS_LABELS,
} from "@/constants/profileReview";
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
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadAvatarAction,
    initialState,
  );

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>编辑资料</CardTitle>
        <CardDescription>
          当前审核状态：
          {PROFILE_REVIEW_STATUS_LABELS[profile.profileReviewStatus]}
          {profile.reviewReason
            ? `（驳回理由：${profile.reviewReason}）`
            : ""}
          。修改昵称/头像后需重新审核；审核通过前全站展示默认资料。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt="当前公开展示头像"
                fill
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>
          <div className="text-sm text-muted-foreground">
            <p>公开展示名：{profile.displayName}</p>
            {profile.nickname ? <p>待审昵称：{profile.nickname}</p> : null}
          </div>
        </div>

        <form action={uploadAction} className="space-y-3">
          <input type="hidden" name="nickname" value={profile.nickname ?? ""} />
          <input type="hidden" name="grade" value={profile.grade ?? ""} />
          <input type="hidden" name="major" value={profile.major ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="avatar">上传头像（JPG/PNG/WebP，≤2MB）</Label>
            <Input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" />
          </div>
          {uploadState.error ? (
            <p className="text-sm text-destructive">{uploadState.error}</p>
          ) : null}
          {uploadState.success ? (
            <p className="text-sm text-green-700">{uploadState.success}</p>
          ) : null}
          <Button type="submit" variant="outline" disabled={uploadPending}>
            {uploadPending ? "上传中..." : "上传并提交审核"}
          </Button>
        </form>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">昵称</Label>
            <Input
              id="nickname"
              name="nickname"
              defaultValue={profile.nickname ?? ""}
              maxLength={30}
              placeholder="可选"
            />
            {state.fieldErrors?.nickname ? (
              <p className="text-sm text-destructive">{state.fieldErrors.nickname}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">头像 URL（可选）</Label>
            <Input
              id="avatarUrl"
              name="avatarUrl"
              defaultValue=""
              placeholder="或使用上方上传"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade">年级</Label>
            <select
              id="grade"
              name="grade"
              defaultValue={profile.grade ?? ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STUDENT_GRADES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="major">专业</Label>
            <Input id="major" name="major" defaultValue={profile.major ?? ""} />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="text-sm text-green-700">{state.success}</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "保存中..." : "保存"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
