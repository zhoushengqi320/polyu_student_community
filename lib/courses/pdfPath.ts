/** 本地课程 PDF 根目录（与 import 脚本 DEFAULT_COURSE_DIR 一致） */
export const COURSE_PDF_DIR_NAME = "课程";

/** 旧目录名，兼容历史数据 */
export const LEGACY_COURSE_PDF_DIR_NAME = "学科";

export function normalizeCoursePdfRelativePath(
  storagePath: string,
): string {
  return storagePath
    .replace(new RegExp(`^${COURSE_PDF_DIR_NAME}/`), "")
    .replace(new RegExp(`^${LEGACY_COURSE_PDF_DIR_NAME}/`), "")
    .trim();
}

export function getCoursePdfPublicHref(
  pdfStoragePath: string | null | undefined,
  pdfUrl: string | null | undefined,
): string | null {
  if (pdfUrl) {
    return pdfUrl;
  }

  if (!pdfStoragePath) {
    return null;
  }

  const relativePath = normalizeCoursePdfRelativePath(pdfStoragePath);
  if (!relativePath.toLowerCase().endsWith(".pdf")) {
    return null;
  }

  return `/course-pdfs/${relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}
