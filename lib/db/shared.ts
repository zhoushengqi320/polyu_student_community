export class DbError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "FORBIDDEN" | "VALIDATION" | "UNKNOWN" = "UNKNOWN",
  ) {
    super(message);
    this.name = "DbError";
  }

  static notFound(resource = "内容") {
    return new DbError(`${resource}不存在`, "NOT_FOUND");
  }

  static forbidden(message = "没有操作权限") {
    return new DbError(message, "FORBIDDEN");
  }
}

/** 避免把 Postgres 约束名等内部信息直接展示给用户 */
export function toUserFacingDbError(
  error: { message?: string } | null | undefined,
  fallback: string,
): DbError {
  const message = error?.message ?? "";
  if (
    message.includes("violates check constraint") ||
    message.includes("violates not-null constraint") ||
    message.includes("invalid input syntax")
  ) {
    return new DbError(fallback, "VALIDATION");
  }

  return new DbError(message || fallback, "UNKNOWN");
}

export const DEFAULT_PAGE_SIZE = 20;

export function getPagination(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  return { page: safePage, pageSize: safePageSize, from, to };
}

export function toPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return {
    data,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
