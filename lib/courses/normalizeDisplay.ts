/** 展示层规范化：修正库中尚未重新导入的脏字段 */

export function normalizeDisplayLevel(
  level: string | null | undefined,
): string | null {
  if (level == null || level === "") {
    return null;
  }

  const trimmed = level.trim();
  const leadingDigit = trimmed.match(/^(\d{1,2})\b/);
  if (leadingDigit) {
    return leadingDigit[1];
  }
  if (/^M\b/i.test(trimmed)) {
    return "M";
  }
  const colonDigit = trimmed.match(/:(\d{1,2})(?:\s|$|[):;])/);
  if (colonDigit) {
    return colonDigit[1];
  }
  if (trimmed.length <= 3) {
    return trimmed;
  }

  return null;
}

export function normalizeDisplayName(
  name: string,
  code: string,
): string {
  if (!name || name.toUpperCase() === code.toUpperCase()) {
    return "（课程名称待补充）";
  }
  if (/^（待补充）/.test(name)) {
    return "（课程名称待补充）";
  }
  if (
    /\b(subject code|subject title|credit value|course description form)\b/i.test(
      name,
    )
  ) {
    return "（课程名称待补充）";
  }
  return name;
}

export function normalizeDisplayCode(code: string): string {
  return code
    .replace(/_+(LMS|CMBA|MBA|UG|PG)$/i, "")
    .replace(/_+$/g, "")
    .trim();
}
