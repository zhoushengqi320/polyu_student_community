const DATE_FORMATTER = new Intl.DateTimeFormat("zh-HK", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("zh-HK", {
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

export function formatRelativeTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 1) {
    return "剛剛";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}分鐘前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}小時前`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}天前`;
  }

  return formatDate(date);
}
