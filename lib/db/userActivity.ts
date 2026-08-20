import {
  USER_ACTIVITY_CREATION_POINTS,
  USER_ACTIVITY_DAILY_CAPS,
  USER_ACTIVITY_INTERACTION_POINTS,
  USER_ACTIVITY_PENALTIES,
  USER_ACTIVITY_SCORE_CAPS,
  USER_ACTIVITY_TIER_LABELS,
  USER_ACTIVITY_WEIGHTS,
  resolveUserActivityTier,
} from "@/constants/userActivity";
import { USER_ROLES, USER_STATUS } from "@/constants/userRoles";
import { DbError } from "@/lib/db/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type UserActivitySnapshot } from "@/types/userActivity";

const WINDOW_DAYS = 90;
const MS_PER_DAY = 86_400_000;

type ActivityUserInput = {
  id: string;
  role: string;
  status: string;
  createdAt: string;
  polyuVerifiedAt: string | null;
  lastSeenAt: string | null;
  lastSignInAt: string | null;
  reporterWarningCount: number;
  bannedUntil: string | null;
  profileReviewStatus: string;
};

type TimedEvent = {
  userId: string;
  createdAt: string;
  kind: keyof typeof eventPoints;
  dayKey: string;
};

const eventPoints = {
  forumPost: USER_ACTIVITY_CREATION_POINTS.forumPost,
  guidePost: USER_ACTIVITY_CREATION_POINTS.guidePost,
  comment: USER_ACTIVITY_CREATION_POINTS.comment,
  courseReview: USER_ACTIVITY_CREATION_POINTS.courseReview,
  foodRecommendation: USER_ACTIVITY_CREATION_POINTS.foodRecommendation,
  like: USER_ACTIVITY_INTERACTION_POINTS.like,
  favorite: USER_ACTIVITY_INTERACTION_POINTS.favorite,
} as const;

const eventDailyCaps: Record<keyof typeof eventPoints, number> = {
  forumPost: USER_ACTIVITY_DAILY_CAPS.forumPost,
  guidePost: USER_ACTIVITY_DAILY_CAPS.guidePost,
  comment: USER_ACTIVITY_DAILY_CAPS.comment,
  courseReview: USER_ACTIVITY_DAILY_CAPS.courseReview,
  foodRecommendation: USER_ACTIVITY_DAILY_CAPS.foodRecommendation,
  like: USER_ACTIVITY_DAILY_CAPS.like,
  favorite: USER_ACTIVITY_DAILY_CAPS.favorite,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function bucketWeight(createdAt: string, now: Date): number {
  const days = (now.getTime() - new Date(createdAt).getTime()) / MS_PER_DAY;
  if (days <= 7) {
    return 1;
  }
  if (days <= 30) {
    return 0.65;
  }
  if (days <= WINDOW_DAYS) {
    return 0.35;
  }
  return 0;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function computeVisitScore(lastActiveAt: string | null): number {
  if (!lastActiveAt) {
    return 0;
  }

  const days = (Date.now() - new Date(lastActiveAt).getTime()) / MS_PER_DAY;
  if (days <= 1) {
    return 100;
  }
  if (days <= 3) {
    return 85;
  }
  if (days <= 7) {
    return 70;
  }
  if (days <= 14) {
    return 50;
  }
  if (days <= 30) {
    return 25;
  }
  return 0;
}

function accumulateCappedEvents(
  events: TimedEvent[],
  kinds: Array<keyof typeof eventPoints>,
  now: Date,
): number {
  const tallies = new Map<string, number>();
  let total = 0;

  for (const event of events) {
    if (!kinds.includes(event.kind)) {
      continue;
    }

    const weight = bucketWeight(event.createdAt, now);
    if (weight <= 0) {
      continue;
    }

    const capKey = `${event.userId}:${event.kind}:${event.dayKey}`;
    const used = tallies.get(capKey) ?? 0;
    const cap = eventDailyCaps[event.kind];
    if (used >= cap) {
      continue;
    }

    tallies.set(capKey, used + 1);
    total += eventPoints[event.kind] * weight;
  }

  return total;
}

function computeQualityScore(input: ActivityUserInput, removedCount90d: number): number {
  let raw = 0;

  if (input.polyuVerifiedAt) {
    raw += 30;
  }

  if (input.profileReviewStatus === "approved") {
    raw += 20;
  }

  const accountDays =
    (Date.now() - new Date(input.createdAt).getTime()) / MS_PER_DAY;
  if (accountDays >= 30) {
    raw += 20;
  }

  if (removedCount90d === 0) {
    raw += 30;
  }

  return clamp(raw, 0, 100);
}

function computePenalty(input: ActivityUserInput, removedCount90d: number): number {
  let penalty =
    input.reporterWarningCount * USER_ACTIVITY_PENALTIES.perReportWarning;
  penalty += Math.min(
    removedCount90d * USER_ACTIVITY_PENALTIES.perRemovedContent,
    USER_ACTIVITY_PENALTIES.maxRemovedContentPenalty,
  );
  return penalty;
}

function isCurrentlyBanned(input: ActivityUserInput): boolean {
  if (input.status === USER_STATUS.banned) {
    return true;
  }
  if (!input.bannedUntil) {
    return false;
  }
  return new Date(input.bannedUntil).getTime() > Date.now();
}

function buildSnapshot(
  input: ActivityUserInput,
  events: TimedEvent[],
  removedCount90d: number,
): UserActivitySnapshot {
  const now = new Date();
  const lastActiveAt =
    [input.lastSeenAt, input.lastSignInAt]
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b as string).getTime() - new Date(a as string).getTime(),
      )[0] ?? null;

  const visit = computeVisitScore(lastActiveAt);
  const creationRaw = accumulateCappedEvents(
    events,
    ["forumPost", "guidePost", "comment", "courseReview", "foodRecommendation"],
    now,
  );
  const interactionRaw = accumulateCappedEvents(
    events,
    ["like", "favorite"],
    now,
  );
  const creation = clamp(
    (creationRaw / USER_ACTIVITY_SCORE_CAPS.creationRaw) * 100,
    0,
    100,
  );
  const interaction = clamp(
    (interactionRaw / USER_ACTIVITY_SCORE_CAPS.interactionRaw) * 100,
    0,
    100,
  );
  const quality = computeQualityScore(input, removedCount90d);
  const penalty = computePenalty(input, removedCount90d);

  let score = Math.round(
    visit * USER_ACTIVITY_WEIGHTS.visit +
      creation * USER_ACTIVITY_WEIGHTS.creation +
      interaction * USER_ACTIVITY_WEIGHTS.interaction +
      quality * USER_ACTIVITY_WEIGHTS.quality -
      penalty,
  );

  if (isCurrentlyBanned(input)) {
    score = Math.min(score, USER_ACTIVITY_PENALTIES.bannedScoreCap);
  }

  score = clamp(score, 0, 100);
  const tier = resolveUserActivityTier(score);

  return {
    score,
    tier,
    tierLabel: USER_ACTIVITY_TIER_LABELS[tier],
    lastActiveAt,
    breakdown: {
      visit: Math.round(visit),
      creation: Math.round(creation),
      interaction: Math.round(interaction),
      quality: Math.round(quality),
      penalty: Math.round(penalty),
    },
  };
}

async function fetchTimedEvents(
  userIds: string[],
  sinceIso: string,
): Promise<TimedEvent[]> {
  if (!isSupabaseConfigured() || userIds.length === 0) {
    return [];
  }

  const admin = createAdminClient();
  const events: TimedEvent[] = [];

  const { data: posts, error: postsError } = await admin
    .from("posts")
    .select("user_id, module, created_at")
    .in("user_id", userIds)
    .gte("created_at", sinceIso)
    .is("deleted_at", null);

  if (postsError) {
    throw new DbError(postsError.message);
  }

  for (const row of posts ?? []) {
    const postModule = String(row.module);
    const kind =
      postModule === "forum" ? "forumPost" : ("guidePost" as const);
    events.push({
      userId: String(row.user_id),
      createdAt: String(row.created_at),
      kind,
      dayKey: dayKey(String(row.created_at)),
    });
  }

  const { data: comments, error: commentsError } = await admin
    .from("comments")
    .select("user_id, created_at")
    .in("user_id", userIds)
    .gte("created_at", sinceIso)
    .is("deleted_at", null);

  if (commentsError) {
    throw new DbError(commentsError.message);
  }

  for (const row of comments ?? []) {
    events.push({
      userId: String(row.user_id),
      createdAt: String(row.created_at),
      kind: "comment",
      dayKey: dayKey(String(row.created_at)),
    });
  }

  const { data: reviews, error: reviewsError } = await admin
    .from("course_reviews")
    .select("user_id, created_at")
    .in("user_id", userIds)
    .gte("created_at", sinceIso)
    .is("deleted_at", null);

  if (reviewsError) {
    throw new DbError(reviewsError.message);
  }

  for (const row of reviews ?? []) {
    events.push({
      userId: String(row.user_id),
      createdAt: String(row.created_at),
      kind: "courseReview",
      dayKey: dayKey(String(row.created_at)),
    });
  }

  const { data: foodRows, error: foodError } = await admin
    .from("food_recommendations")
    .select("user_id, created_at")
    .in("user_id", userIds)
    .gte("created_at", sinceIso)
    .is("deleted_at", null);

  if (foodError) {
    throw new DbError(foodError.message);
  }

  for (const row of foodRows ?? []) {
    events.push({
      userId: String(row.user_id),
      createdAt: String(row.created_at),
      kind: "foodRecommendation",
      dayKey: dayKey(String(row.created_at)),
    });
  }

  const { data: reactions, error: reactionsError } = await admin
    .from("reactions")
    .select("user_id, type, created_at")
    .in("user_id", userIds)
    .gte("created_at", sinceIso);

  if (reactionsError) {
    throw new DbError(reactionsError.message);
  }

  for (const row of reactions ?? []) {
    const reactionType = String(row.type);
    if (reactionType !== "like" && reactionType !== "favorite") {
      continue;
    }
    events.push({
      userId: String(row.user_id),
      createdAt: String(row.created_at),
      kind: reactionType,
      dayKey: dayKey(String(row.created_at)),
    });
  }

  return events;
}

async function fetchRemovedCounts90d(
  userIds: string[],
  sinceIso: string,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const id of userIds) {
    counts.set(id, 0);
  }

  if (!isSupabaseConfigured() || userIds.length === 0) {
    return counts;
  }

  const admin = createAdminClient();
  const tables = ["posts", "comments", "course_reviews"] as const;

  for (const table of tables) {
    const { data, error } = await admin
      .from(table)
      .select("user_id")
      .in("user_id", userIds)
      .gte("deleted_at", sinceIso)
      .not("deleted_at", "is", null);

    if (error) {
      throw new DbError(error.message);
    }

    for (const row of data ?? []) {
      const userId = String(row.user_id);
      counts.set(userId, (counts.get(userId) ?? 0) + 1);
    }
  }

  return counts;
}

/** 批量计算用户活跃度（admin 账号跳过）。 */
export async function computeActivityForUsers(
  users: ActivityUserInput[],
): Promise<Map<string, UserActivitySnapshot>> {
  const result = new Map<string, UserActivitySnapshot>();
  const scorable = users.filter((user) => user.role !== USER_ROLES.admin);

  if (scorable.length === 0) {
    return result;
  }

  const userIds = scorable.map((user) => user.id);
  const since = new Date(Date.now() - WINDOW_DAYS * MS_PER_DAY).toISOString();

  const [events, removedCounts] = await Promise.all([
    fetchTimedEvents(userIds, since),
    fetchRemovedCounts90d(userIds, since),
  ]);

  const eventsByUser = new Map<string, TimedEvent[]>();
  for (const event of events) {
    const list = eventsByUser.get(event.userId) ?? [];
    list.push(event);
    eventsByUser.set(event.userId, list);
  }

  for (const user of scorable) {
    result.set(
      user.id,
      buildSnapshot(
        user,
        eventsByUser.get(user.id) ?? [],
        removedCounts.get(user.id) ?? 0,
      ),
    );
  }

  return result;
}

export type { ActivityUserInput };
