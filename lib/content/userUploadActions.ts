"use server";

import { getSessionUser } from "@/lib/auth/session";
import { buildContentWithUploads } from "@/lib/content/buildContentWithUploads";
import {
  USER_UPLOAD_BUCKET,
  uploadUserImageToStorage,
} from "@/lib/content/uploadUserImageStorage";
import {
  attachUserUploads,
  cancelPendingUserUpload,
  createPendingUserUpload,
  listPendingUserUploadsForUser,
} from "@/lib/db/userUploads";
import {
  USER_UPLOAD_LIMITS,
  type UserUploadModule,
} from "@/constants/userUploads";
import { assertCan, isBanned } from "@/lib/utils/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { z } from "zod";

export type UserUploadActionState = {
  error?: string;
  upload?: {
    id: string;
    publicUrl: string;
  };
};

const uploadIdSchema = z.string().uuid();

export async function uploadUserImageAction(
  _prev: UserUploadActionState,
  formData: FormData,
): Promise<UserUploadActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }

  if (isBanned(user)) {
    return { error: "当前账号无法上传图片" };
  }

  const moduleRaw = String(formData.get("module") ?? "");
  const module =
    moduleRaw === "feedback" || moduleRaw === "forum" || moduleRaw === "food"
      ? moduleRaw
      : null;

  if (!module) {
    return { error: "无效的上传模块" };
  }

  try {
    if (module === "feedback") {
      assertCan(user, "content:create:feedback");
    } else if (module === "forum") {
      assertCan(user, "content:create:forum");
    } else {
      assertCan(user, "content:create:food");
    }
  } catch {
    return { error: "当前账号无法上传图片" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "请选择图片文件" };
  }

  const altText = String(formData.get("alt") ?? "").trim() || "截图";

  const stored = await uploadUserImageToStorage(user.id, file, module);
  if (!stored.ok) {
    return { error: stored.error };
  }

  try {
    const record = await createPendingUserUpload({
      userId: user.id,
      storageBucket: USER_UPLOAD_BUCKET,
      storagePath: stored.storagePath,
      publicUrl: stored.publicUrl,
      mimeType: stored.mimeType,
      byteSize: stored.byteSize,
      module,
      altText,
    });

    return {
      upload: {
        id: record.id,
        publicUrl: record.publicUrl,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存上传记录失败",
    };
  }
}

export async function cancelUserUploadAction(
  _prev: UserUploadActionState,
  formData: FormData,
): Promise<UserUploadActionState> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }

  const parsed = uploadIdSchema.safeParse(formData.get("uploadId"));
  if (!parsed.success) {
    return { error: "无效的图片" };
  }

  await cancelPendingUserUpload(user.id, parsed.data);
  return {};
}

/** 校验 uploadIds 并绑定到目标，返回用于写入 content 的正文 */
export async function finalizeContentWithUserUploads(input: {
  userId: string;
  textContent: string;
  uploadIds: string[];
  targetType: string;
  targetId: string;
  module: UserUploadModule;
}): Promise<string> {
  if (input.uploadIds.length === 0) {
    return input.textContent.trim();
  }

  if (input.uploadIds.length > USER_UPLOAD_LIMITS.maxFilesPerSubmit) {
    throw new Error(`最多上传 ${USER_UPLOAD_LIMITS.maxFilesPerSubmit} 张图片`);
  }

  for (const id of input.uploadIds) {
    if (!uploadIdSchema.safeParse(id).success) {
      throw new Error("无效的图片 ID");
    }
  }

  const attached = await attachUserUploads({
    userId: input.userId,
    uploadIds: input.uploadIds,
    targetType: input.targetType,
    targetId: input.targetId,
    module: input.module,
  });

  return buildContentWithUploads(input.textContent, attached);
}

/** 提交前预检：uploadIds 均属当前用户且 pending */
export async function validatePendingUploadIds(
  userId: string,
  uploadIds: string[],
  module: UserUploadModule,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (uploadIds.length === 0) {
    return { ok: true };
  }

  if (uploadIds.length > USER_UPLOAD_LIMITS.maxFilesPerSubmit) {
    return {
      ok: false,
      error: `最多上传 ${USER_UPLOAD_LIMITS.maxFilesPerSubmit} 张图片`,
    };
  }

  for (const id of uploadIds) {
    if (!uploadIdSchema.safeParse(id).success) {
      return { ok: false, error: "无效的图片" };
    }
  }

  const pending = await listPendingUserUploadsForUser(userId, uploadIds);
  if (pending.length !== uploadIds.length) {
    return { ok: false, error: "部分图片无效或已过期，请重新上传" };
  }

  if (pending.some((item) => item.module !== module)) {
    return { ok: false, error: "图片模块不匹配" };
  }

  return { ok: true };
}
