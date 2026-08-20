/** 仅允许 http(s) 与站内相对路径，拦截 javascript:/data: 等 */
export function isSafeHref(href: string | null | undefined): boolean {
  if (!href) {
    return false;
  }
  const value = href.trim();
  if (!value || value.length > 2000) {
    return false;
  }
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSafeImageSrc(src: string | null | undefined): boolean {
  return isSafeHref(src);
}
