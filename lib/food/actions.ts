"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import {
  createFoodPlace,
  createFoodRecommendation,
  softDeleteFoodRecommendation,
  updateFoodRecommendationContent,
} from "@/lib/db/food";
import { DbError } from "@/lib/db/shared";
import { buildContentWithUploads } from "@/lib/content/buildContentWithUploads";
import { attachUserUploads } from "@/lib/db/userUploads";
import { validatePendingUploadIds } from "@/lib/content/userUploadActions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { assertCan } from "@/lib/utils/permissions";
import { getPermissionDeniedMessage } from "@/lib/utils/authPrompts";
import {
  foodPlaceSubmitSchema,
  foodRecommendationSchema,
} from "@/lib/validations/foodSchema";

export type FoodFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

export async function createFoodRecommendationAction(
  _prevState: FoodFormState,
  formData: FormData,
): Promise<FoodFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  try {
    assertCan(user, "content:create:food");
  } catch {
    return { error: getPermissionDeniedMessage(user, "发布推荐") };
  }
  if (!user) return { error: getPermissionDeniedMessage(null, "发布推荐") };

  const uploadIds = formData
    .getAll("uploadIds")
    .map((item) => String(item).trim())
    .filter(Boolean);

  const parsed = foodRecommendationSchema.safeParse({
    placeId: formData.get("placeId"),
    rating: formData.get("rating"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] = issue.message;
    }
    return { fieldErrors, error: "请检查推荐内容" };
  }

  const uploadCheck = await validatePendingUploadIds(
    user.id,
    uploadIds,
    "food",
  );
  if (!uploadCheck.ok) {
    return { error: uploadCheck.error };
  }

  try {
    const recommendation = await createFoodRecommendation({
      placeId: parsed.data.placeId,
      userId: user.id,
      rating: parsed.data.rating,
      content: parsed.data.content,
    });

    if (uploadIds.length > 0) {
      const attached = await attachUserUploads({
        userId: user.id,
        uploadIds,
        targetType: "food_recommendation",
        targetId: recommendation.id,
        module: "food",
      });
      const fullContent = buildContentWithUploads(parsed.data.content, attached);
      await updateFoodRecommendationContent(recommendation.id, fullContent);
    }

    revalidatePath(ROUTES.food.list);
    revalidatePath(ROUTES.food.detail(parsed.data.placeId));
    return { success: "推荐已发布" };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "发布失败，请稍后重试",
    };
  }
}

export async function submitFoodPlaceAction(
  _prevState: FoodFormState,
  formData: FormData,
): Promise<FoodFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  try {
    assertCan(user, "content:create:food");
  } catch {
    return { error: getPermissionDeniedMessage(user, "提交地点") };
  }
  if (!user) return { error: getPermissionDeniedMessage(null, "提交地点") };

  const uploadIds = formData
    .getAll("uploadIds")
    .map((item) => String(item).trim())
    .filter(Boolean);

  const parsed = foodPlaceSubmitSchema.safeParse({
    name: formData.get("name"),
    area: formData.get("area"),
    category: formData.get("category"),
    address: formData.get("address"),
    tags: formData.get("tags"),
    rating: formData.get("rating"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] = issue.message;
    }
    return { fieldErrors, error: "请检查提交内容" };
  }

  const uploadCheck = await validatePendingUploadIds(
    user.id,
    uploadIds,
    "food",
  );
  if (!uploadCheck.ok) {
    return { error: uploadCheck.error };
  }

  try {
    const place = await createFoodPlace({
      name: parsed.data.name,
      area: parsed.data.area,
      category: parsed.data.category,
      address: parsed.data.address,
      tags: parsed.data.tags,
    });
    const recommendation = await createFoodRecommendation({
      placeId: place.id,
      userId: user.id,
      rating: parsed.data.rating,
      content: parsed.data.content,
    });

    if (uploadIds.length > 0) {
      const attached = await attachUserUploads({
        userId: user.id,
        uploadIds,
        targetType: "food_recommendation",
        targetId: recommendation.id,
        module: "food",
      });
      const fullContent = buildContentWithUploads(parsed.data.content, attached);
      await updateFoodRecommendationContent(recommendation.id, fullContent);
    }

    revalidatePath(ROUTES.food.list);
    revalidatePath(ROUTES.food.detail(place.id));
    redirect(ROUTES.food.detail(place.id));
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      error: error instanceof DbError ? error.message : "提交失败，请稍后重试",
    };
  }
}

export async function deleteOwnFoodRecommendationAction(
  recommendationId: string,
  placeId: string,
  _prevState: FoodFormState,
  _formData: FormData,
): Promise<FoodFormState> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }

  try {
    await softDeleteFoodRecommendation(recommendationId, user.id);
    revalidatePath(ROUTES.food.detail(placeId));
    revalidatePath(ROUTES.food.list);
    return { success: "已删除推荐" };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "删除失败",
    };
  }
}
