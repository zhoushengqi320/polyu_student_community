import { APP_LOCALE } from "@/constants/site";

const DATE_FORMATTER = new Intl.DateTimeFormat(APP_LOCALE, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat(APP_LOCALE, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return DATE_FORMATTER.format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return DATETIME_FORMATTER.format(date);
}

export function formatDateTimeSafe(
  value: string | Date,
  fallback = "—",
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }
  return DATETIME_FORMATTER.format(date);
}

export function formatRelativeTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 1) {
    return "刚刚";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}天前`;
  }

  return formatDate(date);
}
