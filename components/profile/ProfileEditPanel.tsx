"use client";

import { useState } from "react";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ProfileChangePasswordForm } from "@/components/profile/ProfileChangePasswordForm";
import { Button } from "@/components/ui/button";
import { logoutFormAction } from "@/lib/auth/actions";
import { type Profile } from "@/types/user";

type ProfileEditPanelProps = {
  profile: Profile;
  email: string | null;
};

export function ProfileEditPanel({ profile, email }: ProfileEditPanelProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing((open) => !open)}
        >
          {editing ? "收起修改" : "修改信息"}
        </Button>
        <form action={logoutFormAction}>
          <Button type="submit" variant="outline" size="sm">
            退出登录
          </Button>
        </form>
      </div>

      {editing ? (
        <div className="space-y-6">
          <ProfileEditForm profile={profile} />
          {email ? <ProfileChangePasswordForm email={email} /> : null}
        </div>
      ) : null}
    </div>
  );
}
