"use server";

import { requireAdmin } from "@/lib/admin/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "content-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type UploadContentImageResult =
  | { success: true; url: string; markdown: string }
  | { success: false; error: string };

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

export async function uploadContentImageAction(
  formData: FormData,
): Promise<UploadContentImageResult> {
  try {
    const admin = await requireAdmin();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return { success: false, error: "请选择图片文件" };
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return { success: false, error: "仅支持 JPG / PNG / WebP / GIF" };
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return { success: false, error: "图片大小需在 5MB 以内" };
    }

    const ext = extensionForMime(file.type);
    const path = `${admin.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    // 优先用登录态 + Storage RLS；失败再尝试 service role
    let publicUrl: string | null = null;

    try {
      const supabase = await createClient();
      const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });

      if (!error) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        publicUrl = data.publicUrl;
      }
    } catch {
      // fall through to service role
    }

    if (!publicUrl) {
      const adminClient = createAdminClient();
      const { error } = await adminClient.storage.from(BUCKET).upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });

      if (error) {
        return {
          success: false,
          error: `上传失败：${error.message}。请确认已在 Supabase 执行迁移 013_content_images_storage.sql`,
        };
      }

      const { data } = adminClient.storage.from(BUCKET).getPublicUrl(path);
      publicUrl = data.publicUrl;
    }

    if (!publicUrl) {
      return { success: false, error: "无法生成图片公开地址" };
    }

    const alt = (formData.get("alt") as string | null)?.trim() || "图片";
    return {
      success: true,
      url: publicUrl,
      markdown: `![${alt}](${publicUrl})`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "上传失败，请稍后重试",
    };
  }
}
