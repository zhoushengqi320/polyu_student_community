import { OTP_SPAM_HINT, OTP_LENGTH } from "@/constants/auth";
import { SITE_NAME } from "@/constants/site";
import { isDevShowLoginOtp } from "@/lib/auth/devLoginOtp";

export type SendOtpEmailResult =
  | { ok: true; skipped: boolean }
  | { ok: false; error: string };

function buildOtpEmailHtml(code: string, purposeLabel: string): string {
  return `
    <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
      <p>你好，</p>
      <p>你正在进行 ${SITE_NAME} 的${purposeLabel}。</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      <p>验证码 ${OTP_LENGTH} 位数字，有效期 60 分钟。</p>
      <p style="color: #b45309;"><strong>提示：</strong>${OTP_SPAM_HINT}</p>
      <p>如非本人操作，请忽略本邮件。</p>
    </div>
  `;
}

function purposeLabel(purpose: string): string {
  switch (purpose) {
    case "register":
      return "账号注册";
    case "login":
      return "邮箱验证码登录";
    case "reset_password":
      return "密码重置";
    default:
      return "身份验证";
  }
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
): Promise<SendOtpEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL || "PolyUHub <onboarding@resend.dev>";

  if (!apiKey) {
    return { ok: false, error: "missing_resend" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Resend email failed:", text);
    return { ok: false, error: "邮件发送失败，请稍后重试" };
  }

  return { ok: true, skipped: false };
}

async function sendViaSmtp(
  _to: string,
  _subject: string,
  _html: string,
): Promise<SendOtpEmailResult> {
  // SMTP 需自行安装 nodemailer；当前优先使用 Resend
  return {
    ok: false,
    error:
      "检测到 SMTP_* 配置，但项目未内置 nodemailer。请改用 RESEND_API_KEY，或安装 nodemailer 后再扩展发信实现。",
  };
}

/**
 * 发送 OTP 邮件。
 * DEV_SHOW_LOGIN_OTP=true 时跳过真实发信（由调用方把 OTP 展示在页面）。
 */
export async function sendOtpEmail(options: {
  email: string;
  code: string;
  purpose: "register" | "login" | "reset_password";
}): Promise<SendOtpEmailResult> {
  if (isDevShowLoginOtp()) {
    return { ok: true, skipped: true };
  }

  const label = purposeLabel(options.purpose);
  const subject = `【${SITE_NAME}】${label}验证码`;
  const html = buildOtpEmailHtml(options.code, label);

  if (process.env.RESEND_API_KEY) {
    return sendViaResend(options.email, subject, html);
  }

  if (process.env.SMTP_HOST) {
    return sendViaSmtp(options.email, subject, html);
  }

  return {
    ok: false,
    error:
      "生产环境未配置邮件发送（请设置 RESEND_API_KEY 或 SMTP_*）。开发调试可设 DEV_SHOW_LOGIN_OTP=true。",
  };
}
