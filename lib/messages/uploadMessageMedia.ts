import { createAdminClient } from "@/lib/supabase/admin";
import {
  MESSAGE_IMAGE_MIME,
  MESSAGE_LIMITS,
  MESSAGE_MEDIA_BUCKET,
  MESSAGE_VIDEO_MIME,
  type MessageMediaMime,
} from "@/constants/messaging";

export type MessageMediaUploadResult =
  | {
      ok: true;
      publicUrl: string;
      mimeType: MessageMediaMime;
      byteSize: number;
      kind: "image" | "video";
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
    case "video/webm":
      return "webm";
    case "video/mp4":
      return "mp4";
    default:
      return "jpg";
  }
}

export async function uploadMessageMediaToStorage(
  userId: string,
  file: File,
): Promise<MessageMediaUploadResult> {
  if (file.size <= 0) {
    return { ok: false, error: "请选择文件" };
  }

  const isImage = MESSAGE_IMAGE_MIME.includes(
    file.type as (typeof MESSAGE_IMAGE_MIME)[number],
  );
  const isVideo = MESSAGE_VIDEO_MIME.includes(
    file.type as (typeof MESSAGE_VIDEO_MIME)[number],
  );

  if (!isImage && !isVideo) {
    return { ok: false, error: "仅支持 JPG / PNG / WebP / GIF / MP4 / WebM" };
  }

  if (isImage && file.size > MESSAGE_LIMITS.maxImageBytes) {
    return { ok: false, error: "单张图片需在 5MB 以内" };
  }

  if (isVideo && file.size > MESSAGE_LIMITS.maxVideoBytes) {
    return { ok: false, error: "单个视频需在 50MB 以内" };
  }

  const ext = extensionForMime(file.type);
  const storagePath = `messages/${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient.storage
      .from(MESSAGE_MEDIA_BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return { ok: false, error: `上传失败：${error.message}` };
    }

    const { data } = adminClient.storage
      .from(MESSAGE_MEDIA_BUCKET)
      .getPublicUrl(storagePath);

    if (!data.publicUrl) {
      return { ok: false, error: "无法生成文件公开地址" };
    }

    return {
      ok: true,
      publicUrl: data.publicUrl,
      mimeType: file.type as MessageMediaMime,
      byteSize: file.size,
      kind: isVideo ? "video" : "image",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "上传失败，请稍后重试",
    };
  }
}
