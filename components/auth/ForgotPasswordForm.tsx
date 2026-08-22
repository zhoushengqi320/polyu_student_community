"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  sendResetOtpAction,
  setNewPasswordAction,
  verifyResetOtpAction,
  type AuthFormState,
} from "@/lib/auth/actions";
import { PASSWORD_MIN_LENGTH, POLYU_EMAIL_SUFFIX } from "@/constants/auth";
import { EMAIL_PLACEHOLDER } from "@/constants/site";
import { ROUTES } from "@/constants/routes";
import { OtpSentHintDialog } from "@/components/auth/OtpSentHintDialog";
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

type Step = "email" | "otp" | "password";

function DevOtpBox({ email, otp }: { email: string; otp: string }) {
  return (
    <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <p className="font-semibold">【开发调试】验证码</p>
      <p>
        邮箱：<span className="font-mono">{email}</span>
      </p>
      <p>
        验证码：
        <span className="font-mono text-base font-bold tracking-widest">{otp}</span>
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

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpHintOpen, setOtpHintOpen] = useState(false);

  const [sendState, sendAction, sendPending] = useActionState(
    sendResetOtpAction,
    initialState,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyResetOtpAction,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    setNewPasswordAction,
    initialState,
  );

  const cooldown = useResendCountdown(sendState.resendAvailableAt);

  useEffect(() => {
    if (sendState.success || sendState.devInfo) {
      setStep("otp");
      setOtpHintOpen(true);
    }
  }, [sendState.success, sendState.devInfo, sendState.resendAvailableAt]);

  useEffect(() => {
    if (verifyState.step === "password") {
      setStep("password");
    }
  }, [verifyState.step]);

  return (
    <Card className="mx-auto w-full max-w-md">
      <OtpSentHintDialog open={otpHintOpen} onOpenChange={setOtpHintOpen} />
      <CardHeader>
        <CardTitle>重置密码</CardTitle>
        <CardDescription>
          向{POLYU_EMAIL_SUFFIX} 发送验证码后设置新密码
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "email" ? (
          <form action={sendAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">理大学生邮箱</Label>
              <Input
                id="reset-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={EMAIL_PLACEHOLDER}
                required
              />
            </div>
            {sendState.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {sendState.error}
              </p>
            ) : null}
            {sendState.devInfo ? <DevOtpBox {...sendState.devInfo} /> : null}
            <Button type="submit" className="w-full" disabled={sendPending || cooldown > 0}>
              {sendPending
                ? "发送中..."
                : cooldown > 0
                  ? `${cooldown}s 后可重发`
                  : "发送验证码"}
            </Button>
          </form>
        ) : null}

        {step === "otp" ? (
          <form action={verifyAction} className="space-y-4">
            <input type="hidden" name="email" value={email} />
            <div className="space-y-2">
              <Label htmlFor="reset-otp">6 位验证码</Label>
              <Input id="reset-otp" name="otp" inputMode="numeric" maxLength={6} required />
            </div>
            {verifyState.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {verifyState.error}
              </p>
            ) : null}
            {sendState.devInfo ? <DevOtpBox {...sendState.devInfo} /> : null}
            <Button type="submit" className="w-full" disabled={verifyPending}>
              {verifyPending ? "验证中..." : "验证"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={sendPending || cooldown > 0}
              onClick={() => {
                const fd = new FormData();
                fd.set("email", email);
                sendAction(fd);
              }}
            >
              {cooldown > 0 ? `${cooldown}s 后可重发` : "重新发送验证码"}
            </Button>
          </form>
        ) : null}

        {step === "password" ? (
          <form action={passwordAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                name="password"
                type="password"
                minLength={PASSWORD_MIN_LENGTH}
                required
              />
              {passwordState.fieldErrors?.password ? (
                <p className="text-sm text-destructive">
                  {passwordState.fieldErrors.password}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-confirm">确认新密码</Label>
              <Input
                id="new-confirm"
                name="confirmPassword"
                type="password"
                minLength={PASSWORD_MIN_LENGTH}
                required
              />
              {passwordState.fieldErrors?.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {passwordState.fieldErrors.confirmPassword}
                </p>
              ) : null}
            </div>
            {passwordState.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {passwordState.error}
              </p>
            ) : null}
            {passwordState.success ? (
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
                {passwordState.success}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={passwordPending}>
              {passwordPending ? "保存中..." : "更新密码并登录"}
            </Button>
          </form>
        ) : null}

        <p className="text-center text-sm text-muted-foreground">
          <Link href={ROUTES.login} className="underline underline-offset-2">
            返回登录
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
