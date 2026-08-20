import { DbError } from "@/lib/db/shared";

export const ADMIN_REVIEW_REASON_MIN = 2;
export const ADMIN_REVIEW_REASON_MAX = 500;

/** 解析并校验后台审核 / 删除操作理由。 */
export function parseAdminReviewReason(raw: unknown): string {
  const reason = String(raw ?? "").trim();
  if (reason.length < ADMIN_REVIEW_REASON_MIN) {
    throw new DbError("请填写操作理由（至少 2 个字）", "VALIDATION");
  }
  if (reason.length > ADMIN_REVIEW_REASON_MAX) {
    throw new DbError(
      `操作理由不能超过 ${ADMIN_REVIEW_REASON_MAX} 字`,
      "VALIDATION",
    );
  }
  return reason;
}
