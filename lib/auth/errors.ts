const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "邮箱或密码错误",
  email_not_confirmed: "请先验证邮箱后再登录",
  user_already_registered: "该邮箱已注册，请直接登录",
  weak_password: "密码强度不足，请使用更复杂的密码",
  over_request_rate_limit: "操作过于频繁，请稍后再试",
};

export function mapAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  for (const [key, value] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (normalized.includes(key.replace(/_/g, " ")) || normalized.includes(key)) {
      return value;
    }
  }

  if (normalized.includes("invalid login credentials")) {
    return AUTH_ERROR_MESSAGES.invalid_credentials;
  }

  if (normalized.includes("already registered")) {
    return AUTH_ERROR_MESSAGES.user_already_registered;
  }

  // 未知英文错误统一返回中文提示
  if (/^[a-zA-Z0-9\s.,!?'"-]+$/.test(message.trim())) {
    return "操作失败，请稍后重试";
  }

  return message || "操作失败，请稍后重试";
}

export function mapAuthFieldErrors(
  message: string,
): Partial<Record<"email" | "password" | "confirmPassword", string>> {
  const normalized = message.toLowerCase();

  if (normalized.includes("email")) {
    return { email: mapAuthErrorMessage(message) };
  }

  if (normalized.includes("password")) {
    return { password: mapAuthErrorMessage(message) };
  }

  return {};
}
