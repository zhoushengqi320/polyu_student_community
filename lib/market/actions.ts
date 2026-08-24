"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ROUTES } from "@/constants/routes";
import { MARKET_MAX_IMAGES } from "@/constants/marketOptions";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { getSessionUser } from "@/lib/auth/session";
import { validatePendingUploadIds } from "@/lib/content/userUploadActions";
import {
  createMarketListing,
  getMarketListingById,
  softDeleteMarketListing,
  updateMarketListing,
  updateMarketListingImageUrls,
  updateMarketListingStatus,
} from "@/lib/db/market";
import { DbError } from "@/lib/db/shared";
import { attachUserUploads } from "@/lib/db/userUploads";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPermissionDeniedMessage } from "@/lib/utils/authPrompts";
import { assertCan, canManageOwnContent } from "@/lib/utils/permissions";
import {
  createMarketListingSchema,
  updateMarketListingSchema,
  updateMarketListingStatusSchema,
} from "@/lib/validations/marketSchema";
import {
  type MarketCategoryId,
  type MarketConditionId,
  type MarketListingStatusId,
  type MarketTradeMethodId,
} from "@/constants/marketOptions";

export type MarketFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

function fieldErrorsFromZod(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    fieldErrors[String(issue.path[0] ?? "form")] = issue.message;
  }
  return fieldErrors;
}

export async function createMarketListingAction(
  _prevState: MarketFormState,
  formData: FormData,
): Promise<MarketFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  try {
    assertCan(user, "content:create:market");
  } catch {
    return { error: getPermissionDeniedMessage(user, "发布闲置") };
  }
  if (!user) {
    return { error: getPermissionDeniedMessage(null, "发布闲置") };
  }

  const uploadIds = formData
    .getAll("uploadIds")
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, MARKET_MAX_IMAGES);

  const parsed = createMarketListingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priceHkd: formData.get("priceHkd"),
    priceNegotiable: formData.get("priceNegotiable"),
    category: formData.get("category"),
    condition: formData.get("condition"),
    tradeMethods: formData.getAll("tradeMethods"),
    contactNote: formData.get("contactNote"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: fieldErrorsFromZod(parsed.error),
      error: "请检查发布内容",
    };
  }

  const uploadCheck = await validatePendingUploadIds(
    user.id,
    uploadIds,
    "market",
  );
  if (!uploadCheck.ok) {
    return { error: uploadCheck.error };
  }

  try {
    const listing = await createMarketListing({
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      priceHkd: parsed.data.priceHkd,
      priceNegotiable: parsed.data.priceNegotiable,
      category: parsed.data.category as MarketCategoryId,
      condition: parsed.data.condition as MarketConditionId,
      tradeMethods: parsed.data.tradeMethods as MarketTradeMethodId[],
      contactNote: parsed.data.contactNote,
      imageUrls: [],
    });

    if (uploadIds.length > 0) {
      const attached = await attachUserUploads({
        userId: user.id,
        uploadIds,
        targetType: TARGET_TYPES.market_listing,
        targetId: listing.id,
        module: "market",
      });
      await updateMarketListingImageUrls(
        listing.id,
        attached.map((item) => item.publicUrl),
      );
    }

    revalidatePath(ROUTES.market.list);
    revalidatePath(ROUTES.market.detail(listing.id));
    redirect(ROUTES.market.detail(listing.id));
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      error: error instanceof DbError ? error.message : "发布失败，请稍后重试",
    };
  }
}

export async function updateMarketListingAction(
  _prevState: MarketFormState,
  formData: FormData,
): Promise<MarketFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }

  const existingIds = formData
    .getAll("existingImageUrls")
    .map((item) => String(item).trim())
    .filter(Boolean);
  const uploadIds = formData
    .getAll("uploadIds")
    .map((item) => String(item).trim())
    .filter(Boolean);

  const parsed = updateMarketListingSchema.safeParse({
    listingId: formData.get("listingId"),
    title: formData.get("title"),
    description: formData.get("description"),
    priceHkd: formData.get("priceHkd"),
    priceNegotiable: formData.get("priceNegotiable"),
    category: formData.get("category"),
    condition: formData.get("condition"),
    tradeMethods: formData.getAll("tradeMethods"),
    contactNote: formData.get("contactNote"),
    listingStatus: formData.get("listingStatus"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: fieldErrorsFromZod(parsed.error),
      error: "请检查编辑内容",
    };
  }

  const existing = await getMarketListingById(parsed.data.listingId, {
    includeHidden: true,
  });
  if (!existing || !canManageOwnContent(user, existing.userId)) {
    return { error: "闲置不存在或无权编辑" };
  }

  const uploadCheck = await validatePendingUploadIds(
    user.id,
    uploadIds,
    "market",
  );
  if (!uploadCheck.ok) {
    return { error: uploadCheck.error };
  }

  try {
    let imageUrls = existingIds.slice(0, MARKET_MAX_IMAGES);

    if (uploadIds.length > 0) {
      const attached = await attachUserUploads({
        userId: user.id,
        uploadIds,
        targetType: TARGET_TYPES.market_listing,
        targetId: existing.id,
        module: "market",
      });
      imageUrls = [...imageUrls, ...attached.map((item) => item.publicUrl)].slice(
        0,
        MARKET_MAX_IMAGES,
      );
    }

    await updateMarketListing(existing.id, user.id, {
      title: parsed.data.title,
      description: parsed.data.description,
      priceHkd: parsed.data.priceHkd,
      priceNegotiable: parsed.data.priceNegotiable,
      category: parsed.data.category as MarketCategoryId,
      condition: parsed.data.condition as MarketConditionId,
      tradeMethods: parsed.data.tradeMethods as MarketTradeMethodId[],
      contactNote: parsed.data.contactNote,
      imageUrls,
      listingStatus: parsed.data.listingStatus as MarketListingStatusId,
    });

    revalidatePath(ROUTES.market.list);
    revalidatePath(ROUTES.market.detail(existing.id));
    revalidatePath(ROUTES.market.edit(existing.id));
    return { success: "已保存修改" };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "保存失败，请稍后重试",
    };
  }
}

export async function updateMarketListingStatusAction(
  _prevState: MarketFormState,
  formData: FormData,
): Promise<MarketFormState> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }

  const parsed = updateMarketListingStatusSchema.safeParse({
    listingId: formData.get("listingId"),
    listingStatus: formData.get("listingStatus"),
  });

  if (!parsed.success) {
    return { error: "状态无效" };
  }

  try {
    await updateMarketListingStatus(
      parsed.data.listingId,
      user.id,
      parsed.data.listingStatus as MarketListingStatusId,
    );
    revalidatePath(ROUTES.market.list);
    revalidatePath(ROUTES.market.detail(parsed.data.listingId));
    return { success: "状态已更新" };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "更新失败",
    };
  }
}

export async function deleteMarketListingAction(
  listingId: string,
  _prevState: MarketFormState,
  _formData: FormData,
): Promise<MarketFormState> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }

  try {
    await softDeleteMarketListing(listingId, user.id);
    revalidatePath(ROUTES.market.list);
    revalidatePath(ROUTES.market.detail(listingId));
    redirect(ROUTES.market.list);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      error: error instanceof DbError ? error.message : "删除失败",
    };
  }
}
