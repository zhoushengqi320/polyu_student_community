"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  changePasswordWithOtpAction,
  sendChangePasswordOtpAction,
  type ChangePasswordFormState,
} from "@/lib/profile/actions";
import {
  OTP_SPAM_HINT,
  PASSWORD_MIN_LENGTH,
} from "@/constants/auth";
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

const initialState: ChangePasswordFormState = {};

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

export function ProfileChangePasswordForm({ email }: { email: string }) {
  const [step, setStep] = useState<"send_otp" | "set_password" | "done">(
    "send_otp",
  );

  const [sendState, sendAction, sendPending] = useActionState(
    sendChangePasswordOtpAction,
    initialState,
  );
  const [changeState, changeAction, changePending] = useActionState(
    changePasswordWithOtpAction,
    initialState,
  );

  const cooldown = useResendCountdown(sendState.resendAvailableAt);

  useEffect(() => {
    if (sendState.step === "set_password" || sendState.success) {
      setStep("set_password");
    }
  }, [sendState.step, sendState.success]);

  useEffect(() => {
    if (changeState.step === "done") {
      setStep("done");
    }
  }, [changeState.step]);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>修改密码</CardTitle>
        <CardDescription>
          将向你的绑定邮箱 <span className="font-mono">{email}</span>{" "}
          发送验证码，验证通过后方可设置新密码。{OTP_SPAM_HINT}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "send_otp" ? (
          <form action={sendAction} className="space-y-4">
            {sendState.error ? (
              <p className="text-sm text-destructive">{sendState.error}</p>
            ) : null}
            {sendState.success ? (
              <p className="text-sm text-green-700">{sendState.success}</p>
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

        {step === "set_password" ? (
          <form action={changeAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="change-otp">6 位验证码</Label>
              <Input
                id="change-otp"
                name="otp"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
              {changeState.fieldErrors?.otp ? (
                <p className="text-sm text-destructive">
                  {changeState.fieldErrors.otp}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                required
              />
              {changeState.fieldErrors?.password ? (
                <p className="text-sm text-destructive">
                  {changeState.fieldErrors.password}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                required
              />
              {changeState.fieldErrors?.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {changeState.fieldErrors.confirmPassword}
                </p>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground">
              密码至少 {PASSWORD_MIN_LENGTH} 位，请避免纯数字或常见弱密码。
            </p>

            {sendState.devInfo ? <DevOtpBox {...sendState.devInfo} /> : null}

            {changeState.error ? (
              <p className="text-sm text-destructive">{changeState.error}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={changePending}>
              {changePending ? "保存中..." : "验证并更新密码"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={sendPending || cooldown > 0}
              onClick={() => sendAction(new FormData())}
            >
              {cooldown > 0 ? `${cooldown}s 后可重发验证码` : "重新发送验证码"}
            </Button>
          </form>
        ) : null}

        {step === "done" && changeState.success ? (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            {changeState.success}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
