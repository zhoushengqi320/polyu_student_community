"use client";

import { useActionState, useEffect } from "react";
import {
  updateOwnProfileAction,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: OnboardingFormState = {};

type ProfileEditFormProps = {
  profile: Profile;
  onClose?: () => void;
};

export function ProfileEditForm({ profile, onClose }: ProfileEditFormProps) {
  const [state, formAction, pending] = useActionState(
    updateOwnProfileAction,
    initialState,
  );

  useEffect(() => {
    if (state.unchanged) {
      onClose?.();
      return;
    }
    if (state.success && !state.error) {
      onClose?.();
    }
  }, [state.unchanged, state.success, state.error, onClose]);

  const previewAvatar =
    profile.pendingAvatarUrl || profile.approvedAvatarUrl || profile.avatarUrl;

  return (
    <Card className="max-w-2xl">
      <CardHeader className="pb-4">
        <CardTitle>修改昵称与头像</CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <form action={formAction} className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">头像</h3>
            <AvatarCropField
              name="avatar"
              label=""
              initialPreviewUrl={previewAvatar}
            />
          </section>

          <section className="space-y-4 border-t pt-8">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">昵称</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                2–30 个字符。留空表示不修改当前昵称。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname" className="sr-only">
                昵称
              </Label>
              <Input
                id="nickname"
                name="nickname"
                defaultValue={profile.nickname ?? profile.approvedNickname ?? ""}
                maxLength={30}
                placeholder="输入新昵称"
                className="max-w-md"
              />
              {state.fieldErrors?.nickname ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.nickname}
                </p>
              ) : null}
            </div>
          </section>

          <section className="space-y-4 border-t pt-8">
            <h3 className="text-sm font-semibold">年级与专业</h3>
            <div className="grid gap-5 sm:grid-cols-2">
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
          </section>

          <div className="space-y-3 border-t pt-8">
            {state.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
            {state.success && !state.unchanged ? (
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {state.success}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "提交中..." : "保存修改"}
              </Button>
              {onClose ? (
                <Button type="button" variant="outline" onClick={onClose}>
                  取消
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
