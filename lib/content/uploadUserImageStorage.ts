import { createAdminClient } from "@/lib/supabase/admin";
import {
  USER_UPLOAD_ALLOWED_MIME,
  USER_UPLOAD_LIMITS,
  type UserUploadModule,
} from "@/constants/userUploads";

const BUCKET = "content-images";

export type StorageUploadResult =
  | {
      ok: true;
      storagePath: string;
      publicUrl: string;
      mimeType: string;
      byteSize: number;
    }
  | { ok: false; error: string };

function extensionForMime(mime: string) {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

/** 写入 Supabase Storage（仅服务端） */
export async function uploadUserImageToStorage(
  userId: string,
  file: File,
  module: UserUploadModule,
): Promise<StorageUploadResult> {
  if (file.size <= 0) {
    return { ok: false, error: "请选择图片文件" };
  }

  if (
    !USER_UPLOAD_ALLOWED_MIME.includes(
      file.type as (typeof USER_UPLOAD_ALLOWED_MIME)[number],
    )
  ) {
    return { ok: false, error: "仅支持 JPG / PNG / WebP / GIF" };
  }

  if (file.size > USER_UPLOAD_LIMITS.maxBytes) {
    return { ok: false, error: "单张图片需在 5MB 以内" };
  }

  const ext = extensionForMime(file.type);
  const storagePath = `user-uploads/${userId}/${module}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient.storage.from(BUCKET).upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return { ok: false, error: `上传失败：${error.message}` };
    }

    const { data } = adminClient.storage.from(BUCKET).getPublicUrl(storagePath);
    if (!data.publicUrl) {
      return { ok: false, error: "无法生成图片公开地址" };
    }

    return {
      ok: true,
      storagePath,
      publicUrl: data.publicUrl,
      mimeType: file.type,
      byteSize: file.size,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "上传失败，请稍后重试",
    };
  }
}

export { BUCKET as USER_UPLOAD_BUCKET };
