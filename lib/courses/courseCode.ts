/** 规范化课程详情路由参数（处理 URL 编码与合讲课号） */
export function normalizeCourseCodeParam(raw: string): string {
  let value = String(raw || "").trim();
  if (!value) return "";

  try {
    // Next 通常已解码一次；若仍含 %XX 再解一次
    if (/%[0-9A-Fa-f]{2}/.test(value)) {
      value = decodeURIComponent(value);
    }
  } catch {
    // keep original
  }

  return value.replace(/\s+/g, "").replace(/\//g, ":").toUpperCase();
}

/** 供 PostgREST ilike 使用，避免 _ % 被当成通配符 */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
