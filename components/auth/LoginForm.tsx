"use client";

import { useActionState } from "react";
import { sendMagicLinkAction, type AuthFormState } from "@/lib/auth/actions";
import { POLYU_EMAIL_SUFFIX } from "@/constants/auth";
import { EMAIL_PLACEHOLDER, SITE_NAME } from "@/constants/site";
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

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    sendMagicLinkAction,
    initialState,
  );

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>理大邮箱登录</CardTitle>
        <CardDescription>
          使用{POLYU_EMAIL_SUFFIX} 邮箱接收 Magic Link，无需密码
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">理大学生邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={EMAIL_PLACEHOLDER}
              required
            />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
            ) : null}
          </div>

          {state.error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              {state.success}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "发送中..." : "发送登录链接"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          首次登录将自动创建{SITE_NAME}账号，并在验证邮箱后引导完善资料。
        </p>
      </CardContent>
    </Card>
  );
}
