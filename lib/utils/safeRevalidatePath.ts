/**
 * 校验并规范化 Server Action 传入的 revalidatePath，防止缓存失效 DoS。
 * 仅允许站内绝对路径，禁止协议、query 注入与过长路径。
 */
export function safeRevalidatePath(
  value: unknown,
  fallback = "/",
): string {
  const raw = String(value ?? "").trim() || fallback;
  if (!raw.startsWith("/")) {
    return fallback;
  }
  if (raw.includes("://") || raw.includes("\\") || raw.includes("\0")) {
    return fallback;
  }
  if (raw.length > 200) {
    return fallback;
  }
  // 去掉 query/hash，只保留 pathname
  const path = raw.split(/[?#]/, 1)[0] || fallback;
  return path.startsWith("/") ? path : fallback;
}
