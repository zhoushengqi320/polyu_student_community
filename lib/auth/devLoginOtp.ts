/** 仅服务端：开发态在页面展示 OTP / 模拟登录链接。生产必须为 false。勿加 NEXT_PUBLIC_ */
export function isDevShowLoginOtp(): boolean {
  return process.env.DEV_SHOW_LOGIN_OTP === "true";
}
