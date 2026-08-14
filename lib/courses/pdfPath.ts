/** 本地课程 PDF 根目录（与 import 脚本 DEFAULT_COURSE_DIR 一致） */
export const COURSE_PDF_DIR_NAME = "课程";

/** 旧目录名，兼容历史数据 */
export const LEGACY_COURSE_PDF_DIR_NAME = "学科";

/** Supabase Storage bucket（管理员上传） */
export const COURSE_PDF_STORAGE_BUCKET = "course_pdfs";

const PATH_PREFIXES = [
  COURSE_PDF_DIR_NAME,
  LEGACY_COURSE_PDF_DIR_NAME,
  COURSE_PDF_STORAGE_BUCKET,
] as const;

export function normalizeCoursePdfRelativePath(storagePath: string): string {
  let relative = storagePath.replace(/\\/g, "/").trim().replace(/^\.\//, "");

  for (const prefix of PATH_PREFIXES) {
    if (relative === prefix) {
      relative = "";
      break;
    }
    if (relative.startsWith(`${prefix}/`)) {
      relative = relative.slice(prefix.length + 1);
      break;
    }
  }

  return relative.replace(/^\/+/, "").replace(/\/{2,}/g, "/");
}

function getSupabasePublicObjectUrl(bucket: string, objectPath: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  if (!base || !objectPath) {
    return null;
  }

  const encodedPath = objectPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

function toCoursePdfRouteHref(relativePath: string): string | null {
  if (!relativePath.toLowerCase().endsWith(".pdf")) {
    return null;
  }

  const encoded = relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return encoded ? `/course-pdfs/${encoded}` : null;
}

/**
 * 课程 PDF 公开链接：
 * 1. 优先 pdf_url（已是完整公开 URL）
 * 2. Storage 路径 course_pdfs/... → Supabase 公开对象 URL（失败则走本地路由再跳转）
 * 3. 本地 课程/学科 路径 → /course-pdfs/... 由路由读盘提供
 */
export function getCoursePdfPublicHref(
  pdfStoragePath: string | null | undefined,
  pdfUrl: string | null | undefined,
): string | null {
  if (pdfUrl?.trim()) {
    return pdfUrl.trim();
  }

  if (!pdfStoragePath?.trim()) {
    return null;
  }

  const normalized = pdfStoragePath.replace(/\\/g, "/").trim();
  if (!normalized.toLowerCase().endsWith(".pdf")) {
    return null;
  }

  if (normalized.startsWith(`${COURSE_PDF_STORAGE_BUCKET}/`)) {
    const objectPath = normalizeCoursePdfRelativePath(normalized);
    return (
      getSupabasePublicObjectUrl(COURSE_PDF_STORAGE_BUCKET, objectPath) ??
      toCoursePdfRouteHref(`${COURSE_PDF_STORAGE_BUCKET}/${objectPath}`)
    );
  }

  return toCoursePdfRouteHref(normalizeCoursePdfRelativePath(normalized));
}
