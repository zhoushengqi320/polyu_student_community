const AUTH_ERROR_MESSAGES: Record<string, string> = {
  email_not_confirmed: "请先通过邮件中的链接完成验证",
  user_already_registered: "该邮箱已注册，请直接请求登录链接",
  over_request_rate_limit: "操作过于频繁，请稍后再试",
  only_polyu_email_allowed: "仅支持理大学生邮箱（@connect.polyu.hk）",
  signup_disabled: "请使用 Magic Link 登录，无需单独注册",
};

export function mapAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("only_polyu_email")) {
    return AUTH_ERROR_MESSAGES.only_polyu_email_allowed;
  }

  if (normalized.includes("rate limit") || normalized.includes("over_request")) {
    return AUTH_ERROR_MESSAGES.over_request_rate_limit;
  }

  if (normalized.includes("email not confirmed")) {
    return AUTH_ERROR_MESSAGES.email_not_confirmed;
  }

  if (normalized.includes("already registered")) {
    return AUTH_ERROR_MESSAGES.user_already_registered;
  }

  if (
    normalized.includes("fetch failed") ||
    normalized.includes("econnreset") ||
    normalized.includes("network") ||
    normalized.includes("socket disconnected") ||
    normalized.includes("ssl") ||
    normalized.includes("enotfound")
  ) {
    return "无法连接 Supabase 服务器，请检查网络、VPN/代理设置，或确认 Supabase 项目未暂停";
  }

  if (normalized.includes("invalid api key") || normalized.includes("invalid jwt")) {
    return "Supabase API Key 无效，请检查 .env.local 中的 NEXT_PUBLIC_SUPABASE_ANON_KEY";
  }

  if (normalized.includes("redirect") || normalized.includes("redirect_uri")) {
    return "回调地址未配置，请在 Supabase → Authentication → URL Configuration 添加 /auth/callback";
  }

  for (const [key, value] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (normalized.includes(key.replace(/_/g, " ")) || normalized.includes(key)) {
      return value;
    }
  }

  if (/^[a-zA-Z0-9\s.,!?'"-]+$/.test(message.trim())) {
    return "操作失败，请稍后重试";
  }

  return message || "操作失败，请稍后重试";
}

export function mapAuthFieldErrors(
  message: string,
): Partial<Record<"email", string>> {
  const normalized = message.toLowerCase();

  if (normalized.includes("email")) {
    return { email: mapAuthErrorMessage(message) };
  }

  return {};
}
