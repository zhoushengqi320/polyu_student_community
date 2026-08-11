import { CONTENT_STATUS } from "@/constants/contentStatus";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { mapFoodPlace, type FoodPlaceRow } from "@/lib/db/mappers/food";
import {
  mapForumPostListItem,
  type ForumPostWithProfileRow,
} from "@/lib/db/mappers/forum";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type Course } from "@/types/course";
import { type FoodPlace } from "@/types/food";

export type FavoriteCourseItem = {
  favoritedAt: string;
  course: Pick<Course, "id" | "code" | "name" | "department">;
};

export type FavoriteFoodPlaceItem = {
  favoritedAt: string;
  place: Pick<FoodPlace, "id" | "name" | "area" | "address">;
};

export type FavoriteForumPostItem = {
  favoritedAt: string;
  post: {
    id: string;
    title: string;
    excerpt: string | null;
    topics: string[];
    commentCount: number;
    authorDisplayName: string;
  };
};

export type UserFavorites = {
  courses: FavoriteCourseItem[];
  foodPlaces: FavoriteFoodPlaceItem[];
  forumPosts: FavoriteForumPostItem[];
};

type ReactionRow = {
  target_type: string;
  target_id: string;
  created_at: string;
};

export async function getUserFavorites(userId: string): Promise<UserFavorites> {
  if (!isSupabaseConfigured()) {
    return { courses: [], foodPlaces: [], forumPosts: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reactions")
    .select("target_type, target_id, created_at")
    .eq("user_id", userId)
    .eq("type", "favorite")
    .in("target_type", [
      TARGET_TYPES.course,
      TARGET_TYPES.food_place,
      TARGET_TYPES.post,
    ])
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to list user favorites:", error);
    return { courses: [], foodPlaces: [], forumPosts: [] };
  }

  const rows = data as ReactionRow[];
  const courseIds = rows
    .filter((row) => row.target_type === TARGET_TYPES.course)
    .map((row) => row.target_id);
  const foodIds = rows
    .filter((row) => row.target_type === TARGET_TYPES.food_place)
    .map((row) => row.target_id);
  const postIds = rows
    .filter((row) => row.target_type === TARGET_TYPES.post)
    .map((row) => row.target_id);

  const favoritedAtById = new Map(
    rows.map((row) => [row.target_id, row.created_at]),
  );

  const [coursesResult, foodResult, postsResult] = await Promise.all([
    courseIds.length > 0
      ? supabase
          .from("courses")
          .select("id, code, name, department")
          .in("id", courseIds)
      : Promise.resolve({ data: [], error: null }),
    foodIds.length > 0
      ? supabase
          .from("food_places")
          .select("id, name, area, address, tags, status, created_at, updated_at")
          .in("id", foodIds)
          .eq("status", CONTENT_STATUS.published)
      : Promise.resolve({ data: [], error: null }),
    postIds.length > 0
      ? supabase
          .from("posts")
          .select("*, profiles(*)")
          .in("id", postIds)
          .eq("module", "forum")
          .eq("status", CONTENT_STATUS.published)
          .is("deleted_at", null)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (coursesResult.error) {
    console.error("Failed to load favorite courses:", coursesResult.error);
  }
  if (foodResult.error) {
    console.error("Failed to load favorite food places:", foodResult.error);
  }
  if (postsResult.error) {
    console.error("Failed to load favorite forum posts:", postsResult.error);
  }

  const courseById = new Map(
    (
      (coursesResult.data ?? []) as Array<{
        id: string;
        code: string;
        name: string;
        department: string;
      }>
    ).map((row) => [row.id, row]),
  );
  const foodById = new Map(
    ((foodResult.data ?? []) as FoodPlaceRow[]).map((row) => [row.id, row]),
  );
  const postById = new Map(
    ((postsResult.data ?? []) as ForumPostWithProfileRow[]).map((row) => [
      row.id,
      mapForumPostListItem(row),
    ]),
  );

  const courses: FavoriteCourseItem[] = [];
  for (const id of courseIds) {
    const row = courseById.get(id);
    if (!row) continue;
    courses.push({
      favoritedAt: favoritedAtById.get(id) ?? new Date(0).toISOString(),
      course: {
        id: row.id,
        code: row.code,
        name: row.name,
        department: row.department,
      },
    });
  }

  const foodPlaces: FavoriteFoodPlaceItem[] = [];
  for (const id of foodIds) {
    const row = foodById.get(id);
    if (!row) continue;
    const place = mapFoodPlace(row);
    foodPlaces.push({
      favoritedAt: favoritedAtById.get(id) ?? new Date(0).toISOString(),
      place: {
        id: place.id,
        name: place.name,
        area: place.area,
        address: place.address,
      },
    });
  }

  const forumPosts: FavoriteForumPostItem[] = [];
  for (const id of postIds) {
    const post = postById.get(id);
    if (!post) continue;
    forumPosts.push({
      favoritedAt: favoritedAtById.get(id) ?? new Date(0).toISOString(),
      post: {
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        topics: post.topics,
        commentCount: post.commentCount,
        authorDisplayName: post.author.displayName ?? "PolyU 同学",
      },
    });
  }

  return { courses, foodPlaces, forumPosts };
}
