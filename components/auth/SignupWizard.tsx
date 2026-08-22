"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  backToRegisterEmailAction,
  completeRegisterAction,
  setRegisterPasswordAction,
  startRegisterAction,
  verifyRegisterOtpAction,
  type AuthFormState,
} from "@/lib/auth/actions";
import { PASSWORD_MIN_LENGTH, POLYU_EMAIL_SUFFIX } from "@/constants/auth";
import { EMAIL_PLACEHOLDER, SITE_NAME } from "@/constants/site";
import { STUDENT_GRADES } from "@/constants/profileOptions";
import { ROUTES } from "@/constants/routes";
import { AvatarCropField } from "@/components/common/AvatarCropField";
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

type Step = "email" | "otp" | "password" | "profile";

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

export function SignupWizard({
  initialStep = "email",
  draftEmail = "",
  initialWhitelisted = false,
}: {
  initialStep?: Step;
  draftEmail?: string;
  initialWhitelisted?: boolean;
}) {
  const [step, setStep] = useState<Step>(initialStep);
  const [email, setEmail] = useState(draftEmail);
  const [whitelisted, setWhitelisted] = useState(initialWhitelisted);
  const [otpHintOpen, setOtpHintOpen] = useState(false);
  /** 用户主动返回改邮箱时，避免旧的 emailState.success 再次把步骤推到验证码 */
  const holdOnEmailStepRef = useRef(false);

  const [emailState, emailAction, emailPending] = useActionState(
    startRegisterAction,
    initialState,
  );
  const [otpState, otpAction, otpPending] = useActionState(
    verifyRegisterOtpAction,
    initialState,
  );
  const [backState, backAction, backPending] = useActionState(
    backToRegisterEmailAction,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    setRegisterPasswordAction,
    initialState,
  );
  const [profileState, profileAction, profilePending] = useActionState(
    completeRegisterAction,
    initialState,
  );

  const cooldown = useResendCountdown(emailState.resendAvailableAt);

  useEffect(() => {
    if (emailState.step === "already_registered") {
      return;
    }
    if (holdOnEmailStepRef.current) {
      return;
    }
    if (emailState.step === "password") {
      setWhitelisted(Boolean(emailState.whitelisted));
      setStep("password");
      return;
    }
    if (emailState.success || emailState.devInfo) {
      setStep("otp");
      setOtpHintOpen(true);
    }
  }, [emailState]);

  useEffect(() => {
    if (otpState.step === "password") {
      setStep("password");
    }
    if (otpState.step === "email") {
      holdOnEmailStepRef.current = true;
      setStep("email");
    }
  }, [otpState.step]);

  useEffect(() => {
    if (backState.step === "email") {
      holdOnEmailStepRef.current = true;
      setStep("email");
    }
  }, [backState.step]);

  useEffect(() => {
    if (passwordState.step === "profile") {
      setStep("profile");
    }
  }, [passwordState.step]);

  useEffect(() => {
    if (profileState.step && profileState.step !== "profile") {
      setStep(profileState.step as Step);
    }
  }, [profileState.step]);

  return (
    <Card className="mx-auto w-full max-w-md">
      <OtpSentHintDialog open={otpHintOpen} onOpenChange={setOtpHintOpen} />
      <CardHeader>
        <CardTitle>注册 {SITE_NAME}</CardTitle>
        <CardDescription>
          仅支持{POLYU_EMAIL_SUFFIX}为后缀的理大邮箱，感谢您的理解
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "password" && whitelisted ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950">
            欢迎，尊贵的白名单用户
          </p>
        ) : null}

        {step === "email" ? (
          <form
            action={(formData) => {
              holdOnEmailStepRef.current = false;
              emailAction(formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="signup-email">理大学生邮箱</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={EMAIL_PLACEHOLDER}
                required
              />
              {emailState.fieldErrors?.email ? (
                <p className="text-sm text-destructive">
                  {emailState.fieldErrors.email}
                </p>
              ) : null}
            </div>
            {emailState.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {emailState.error}
                {emailState.step === "already_registered" ? (
                  <>
                    {" "}
                    <Link href={ROUTES.login} className="underline">
                      去登录
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}
            {backState.success && holdOnEmailStepRef.current ? (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                {backState.success}
              </p>
            ) : null}
            {emailState.devInfo && !holdOnEmailStepRef.current ? (
              <DevOtpBox {...emailState.devInfo} />
            ) : null}
            <Button type="submit" className="w-full" disabled={emailPending || cooldown > 0}>
              {emailPending
                ? "发送中..."
                : cooldown > 0
                  ? `${cooldown}s 后可重发`
                  : "发送验证码"}
            </Button>
          </form>
        ) : null}

        {step === "otp" ? (
          <form action={otpAction} className="space-y-4">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <p className="text-muted-foreground">验证码已发送至</p>
              <p className="break-all font-medium">{email || "当前邮箱"}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-otp">邮箱验证码</Label>
              <Input
                id="signup-otp"
                name="otp"
                inputMode="numeric"
                maxLength={6}
                required
              />
              {otpState.fieldErrors?.otp ? (
                <p className="text-sm text-destructive">{otpState.fieldErrors.otp}</p>
              ) : null}
            </div>
            {otpState.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {otpState.error}
              </p>
            ) : null}
            {emailState.devInfo ? <DevOtpBox {...emailState.devInfo} /> : null}
            <Button type="submit" className="w-full" disabled={otpPending}>
              {otpPending ? "验证中..." : "验证邮箱"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={emailPending || cooldown > 0}
              onClick={() => {
                const fd = new FormData();
                fd.set("email", email);
                emailAction(fd);
              }}
            >
              {cooldown > 0 ? `${cooldown}s 后可重发` : "重新发送验证码"}
            </Button>
            <Button
              type="submit"
              formAction={backAction}
              variant="outline"
              className="w-full"
              disabled={backPending || otpPending}
            >
              {backPending ? "返回中..." : "更改邮箱"}
            </Button>
          </form>
        ) : null}

        {step === "password" ? (
          <form action={passwordAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-password">密码</Label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
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
              <Label htmlFor="signup-confirm">确认密码</Label>
              <Input
                id="signup-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                required
              />
              {passwordState.fieldErrors?.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {passwordState.fieldErrors.confirmPassword}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              密码至少 {PASSWORD_MIN_LENGTH} 位，请避免纯数字或常见弱密码。
            </p>
            {passwordState.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {passwordState.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={passwordPending}>
              {passwordPending ? "保存中..." : "下一步"}
            </Button>
          </form>
        ) : null}

        {step === "profile" ? (
          <form action={profileAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade">年级（必填）</Label>
              <select
                id="grade"
                name="grade"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  请选择年级
                </option>
                {STUDENT_GRADES.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.label}
                  </option>
                ))}
              </select>
              {profileState.fieldErrors?.grade ? (
                <p className="text-sm text-destructive">
                  {profileState.fieldErrors.grade}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">专业（必填）</Label>
              <Input id="major" name="major" required maxLength={100} />
              {profileState.fieldErrors?.major ? (
                <p className="text-sm text-destructive">
                  {profileState.fieldErrors.major}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称（可选）</Label>
              <Input id="nickname" name="nickname" maxLength={30} />
              {profileState.fieldErrors?.nickname ? (
                <p className="text-sm text-destructive">
                  {profileState.fieldErrors.nickname}
                </p>
              ) : null}
            </div>
            <AvatarCropField
              name="avatar"
              label="头像（可选，圆形裁剪）"
            />
            <p className="text-xs text-muted-foreground">
              未设置昵称/头像时将展示系统默认资料。
            </p>
            {profileState.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {profileState.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={profilePending}>
              {profilePending ? "创建账号中..." : "完成注册并登录"}
            </Button>
          </form>
        ) : null}

        <p className="text-center text-sm text-muted-foreground">
          已有账号？{" "}
          <Link href={ROUTES.login} className="underline underline-offset-2">
            去登录
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
