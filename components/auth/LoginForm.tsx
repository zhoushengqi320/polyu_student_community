"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  loginWithPasswordAction,
  sendLoginOtpAction,
  sendMagicLinkAction,
  verifyLoginOtpAction,
  type AuthFormState,
} from "@/lib/auth/actions";
import {
  OTP_SPAM_HINT,
  POLYU_EMAIL_SUFFIX,
} from "@/constants/auth";
import { EMAIL_PLACEHOLDER, SITE_NAME } from "@/constants/site";
import { ROUTES } from "@/constants/routes";
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

type LoginMode = "password" | "otp" | "magic";

function DevOtpBox({
  email,
  otp,
  magicLink,
}: {
  email: string;
  otp: string;
  magicLink?: string;
}) {
  return (
    <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <p className="font-semibold">【开发调试】验证码</p>
      <p>
        邮箱：<span className="font-mono">{email}</span>
      </p>
      <p>
        验证码：
        <span className="font-mono text-base font-bold tracking-widest">
          {otp}
        </span>
      </p>
      {magicLink ? (
        <p className="break-all">
          一键登录：
          <a href={magicLink} className="underline underline-offset-2">
            点击此处完成登录
          </a>
        </p>
      ) : null}
      <p className="text-xs text-amber-800">
        仅本地 DEV_SHOW_LOGIN_OTP=true 时显示；生产环境不会出现。
      </p>
    </div>
  );
}

function useResendCountdown(resendAvailableAt?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!resendAvailableAt) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [resendAvailableAt]);

  return useMemo(() => {
    if (!resendAvailableAt) return 0;
    return Math.max(
      0,
      Math.ceil((new Date(resendAvailableAt).getTime() - now) / 1000),
    );
  }, [resendAvailableAt, now]);
}

export function LoginForm({
  magicLinkEnabled = false,
}: {
  magicLinkEnabled?: boolean;
}) {
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [passwordState, passwordAction, passwordPending] = useActionState(
    loginWithPasswordAction,
    initialState,
  );
  const [sendOtpState, sendOtpAction, sendOtpPending] = useActionState(
    sendLoginOtpAction,
    initialState,
  );
  const [verifyOtpState, verifyOtpAction, verifyOtpPending] = useActionState(
    verifyLoginOtpAction,
    initialState,
  );
  const [magicState, magicAction, magicPending] = useActionState(
    sendMagicLinkAction,
    initialState,
  );

  const showMagic = magicLinkEnabled;
  const activeOtpState = otpSent ? verifyOtpState : sendOtpState;
  const cooldown = useResendCountdown(sendOtpState.resendAvailableAt);

  useEffect(() => {
    if (sendOtpState.success || sendOtpState.devInfo) {
      setOtpSent(true);
    }
  }, [sendOtpState.success, sendOtpState.devInfo]);

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>登录 {SITE_NAME}</CardTitle>
        <CardDescription>
          使用{POLYU_EMAIL_SUFFIX} 邮箱登录（不支持昵称登录）
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "password" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setMode("password")}
          >
            密码登录
          </Button>
          <Button
            type="button"
            variant={mode === "otp" ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setMode("otp");
              setOtpSent(false);
            }}
          >
            验证码登录
          </Button>
        </div>

        {mode === "password" ? (
          <form action={passwordAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">理大学生邮箱</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={EMAIL_PLACEHOLDER}
                required
              />
              {passwordState.fieldErrors?.email ? (
                <p className="text-sm text-destructive">
                  {passwordState.fieldErrors.email}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">密码</Label>
                <Link
                  href={ROUTES.forgotPassword}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  忘记密码
                </Link>
              </div>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {passwordState.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {passwordState.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={passwordPending}>
              {passwordPending ? "登录中..." : "登录"}
            </Button>
          </form>
        ) : null}

        {mode === "otp" ? (
          <div className="space-y-4">
            {!otpSent ? (
              <form action={sendOtpAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp-email">理大学生邮箱</Label>
                  <Input
                    id="otp-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={EMAIL_PLACEHOLDER}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">{OTP_SPAM_HINT}</p>
                {sendOtpState.error ? (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {sendOtpState.error}
                  </p>
                ) : null}
                {sendOtpState.success ? (
                  <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
                    {sendOtpState.success}
                  </p>
                ) : null}
                {sendOtpState.devInfo ? (
                  <DevOtpBox {...sendOtpState.devInfo} />
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendOtpPending || cooldown > 0}
                >
                  {sendOtpPending
                    ? "发送中..."
                    : cooldown > 0
                      ? `${cooldown}s 后可重发`
                      : "获取验证码"}
                </Button>
              </form>
            ) : (
              <form action={verifyOtpAction} className="space-y-4">
                <input type="hidden" name="email" value={email} />
                <div className="space-y-2">
                  <Label htmlFor="login-otp">6 位验证码</Label>
                  <Input
                    id="login-otp"
                    name="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                  />
                  {verifyOtpState.fieldErrors?.otp ? (
                    <p className="text-sm text-destructive">
                      {verifyOtpState.fieldErrors.otp}
                    </p>
                  ) : null}
                </div>
                {activeOtpState.error ? (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {activeOtpState.error}
                  </p>
                ) : null}
                {sendOtpState.devInfo ? (
                  <DevOtpBox {...sendOtpState.devInfo} />
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifyOtpPending}
                >
                  {verifyOtpPending ? "验证中..." : "验证并登录"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={sendOtpPending || cooldown > 0}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("email", email);
                    sendOtpAction(fd);
                  }}
                >
                  {cooldown > 0 ? `${cooldown}s 后可重发` : "重新发送验证码"}
                </Button>
              </form>
            )}
          </div>
        ) : null}

        {showMagic ? (
          <div className="border-t pt-4">
            <button
              type="button"
              className="mb-3 text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => setMode(mode === "magic" ? "password" : "magic")}
            >
              {mode === "magic" ? "返回常规登录" : "使用 Magic Link（实验）"}
            </button>
            {mode === "magic" ? (
              <form action={magicAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">理大学生邮箱</Label>
                  <Input
                    id="magic-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={EMAIL_PLACEHOLDER}
                    required
                  />
                </div>
                {magicState.error ? (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {magicState.error}
                  </p>
                ) : null}
                {magicState.success ? (
                  <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
                    {magicState.success}
                  </p>
                ) : null}
                {magicState.devInfo ? (
                  <DevOtpBox {...magicState.devInfo} />
                ) : null}
                <Button type="submit" className="w-full" disabled={magicPending}>
                  {magicPending ? "发送中..." : "发送 Magic Link"}
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}

        <p className="text-center text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link href={ROUTES.signup} className="underline underline-offset-2">
            注册
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
