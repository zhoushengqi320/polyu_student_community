/** 与 LastSeenHeartbeat 30 分钟节流对齐，略加缓冲 */
export const USER_ONLINE_THRESHOLD_MS = 35 * 60 * 1000;

export function isUserOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) {
    return false;
  }

  const seenAt = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seenAt)) {
    return false;
  }

  return Date.now() - seenAt <= USER_ONLINE_THRESHOLD_MS;
}

export function getOnlinePresenceSortKey(
  lastSeenAt: string | null | undefined,
): number {
  if (!isUserOnline(lastSeenAt)) {
    return 0;
  }

  const seenAt = new Date(lastSeenAt as string).getTime();
  return Number.isNaN(seenAt) ? 0 : seenAt;
}
