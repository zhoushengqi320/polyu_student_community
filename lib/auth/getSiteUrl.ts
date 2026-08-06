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
 * 站点根 URL，用于 Magic Link 回调等。
 * 生产环境请设置 NEXT_PUBLIC_SITE_URL（Railway / 自定义域名优先）。
 * 未设置时可回退到 RAILWAY_PUBLIC_DOMAIN 或 VERCEL_URL（仅服务端运行时）。
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (configured && !isPlaceholderSiteUrl(configured)) {
    return normalizeSiteUrl(configured);
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

export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`;
}
