"use client";

import { useActionState } from "react";
import {
  completeOnboardingAction,
  type OnboardingFormState,
} from "@/lib/profile/actions";
import { STUDENT_GRADES } from "@/constants/profileOptions";
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
          欢迎加入理大社区！请填写以下信息，完成后即可发帖、评论与互动。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">昵称</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={profile.displayName ?? ""}
              placeholder="在社区中展示的名称"
              required
            />
            {state.fieldErrors?.displayName ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.displayName}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              name="username"
              defaultValue={profile.username}
              placeholder="字母、数字、下划线"
              required
            />
            <p className="text-xs text-muted-foreground">
              用于 @ 提及与个人主页地址，可修改系统分配的临时用户名。
            </p>
            {state.fieldErrors?.username ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.username}
              </p>
            ) : null}
          </div>

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

          {state.error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "保存中..." : "完成并进入社区"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
