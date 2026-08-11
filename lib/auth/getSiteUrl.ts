function normalizeSiteUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function isPlaceholderSiteUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("your_") ||
    normalized === "undefined" ||
    normalized === "null"
  );
}

/**
 * 应用根 URL，用于 Magic Link redirectTo。
 * 优先级：
 * 1. NEXT_PUBLIC_APP_URL（推荐，本地/线上分别配置）
 * 2. NEXT_PUBLIC_SITE_URL（兼容旧变量名）
 * 3. RAILWAY_PUBLIC_DOMAIN / VERCEL_URL（托管平台回退）
 * 4. http://localhost:3000
 *
 * 本地示例：NEXT_PUBLIC_APP_URL=http://localhost:3000
 * 线上示例：NEXT_PUBLIC_APP_URL=https://polyuhub.com
 */
export function getAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (appUrl && !isPlaceholderSiteUrl(appUrl)) {
    return normalizeSiteUrl(appUrl);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (siteUrl && !isPlaceholderSiteUrl(siteUrl)) {
    return normalizeSiteUrl(siteUrl);
  }

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    const host = railwayDomain.replace(/^https?:\/\//, "");
    return normalizeSiteUrl(`https://${host}`);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "");
    return normalizeSiteUrl(`https://${host}`);
  }

  return "http://localhost:3000";
}

/** @deprecated 使用 getAppUrl() */
export function getSiteUrl(): string {
  return getAppUrl();
}

/** Magic Link / OAuth 回调地址：{APP_URL}/auth/callback */
export function getAuthCallbackUrl(): string {
  return `${getAppUrl()}/auth/callback`;
}
