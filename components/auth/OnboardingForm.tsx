"use client";

import { useActionState } from "react";
import {
  completeOnboardingAction,
  type OnboardingFormState,
} from "@/lib/profile/actions";
import { STUDENT_GRADES } from "@/constants/profileOptions";
import { type Profile } from "@/types/user";
import { AvatarCropField } from "@/components/common/AvatarCropField";
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

type OnboardingFormProps = {
  profile: Profile;
};

const initialState: OnboardingFormState = {};

export function OnboardingForm({ profile }: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    initialState,
  );

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>完善个人资料</CardTitle>
        <CardDescription>
          年级与专业必填；昵称与头像可选，保存后立即生效。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grade">年级</Label>
            <select
              id="grade"
              name="grade"
              defaultValue={profile.grade ?? ""}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                请选择年级
              </option>
              {STUDENT_GRADES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.grade ? (
              <p className="text-sm text-destructive">{state.fieldErrors.grade}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="major">专业</Label>
            <Input
              id="major"
              name="major"
              defaultValue={profile.major ?? ""}
              placeholder="例如：计算机科学、工商管理"
              required
            />
            {state.fieldErrors?.major ? (
              <p className="text-sm text-destructive">{state.fieldErrors.major}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">昵称（可选）</Label>
            <Input
              id="nickname"
              name="nickname"
              defaultValue={profile.nickname ?? ""}
              placeholder="在社区中展示的名称"
              maxLength={30}
            />
            {state.fieldErrors?.nickname ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.nickname}
              </p>
            ) : null}
          </div>

          <AvatarCropField
            name="avatar"
            label="头像（可选，圆形裁剪）"
            initialPreviewUrl={
              profile.pendingAvatarUrl || profile.approvedAvatarUrl || null
            }
          />

          {state.error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <CommunityRulesNotice message="参与讨论前请了解社区规则，共同维护校园信息社区。" />

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "保存中..." : "完成并进入社区"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
