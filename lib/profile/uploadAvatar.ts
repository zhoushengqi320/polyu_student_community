import {
  AVATAR_ALLOWED_MIME,
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
} from "@/constants/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { detectImageMimeFromBytes } from "@/lib/utils/fileMagic";

export type UploadAvatarResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

function resolveExtension(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function uploadAvatarFromFormData(
  userId: string,
  file: File,
  options?: { useServiceRole?: boolean },
): Promise<UploadAvatarResult> {
  if (file.size <= 0) {
    return { ok: false, error: "请选择头像文件" };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: "头像不能超过 2MB" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImageMimeFromBytes(new Uint8Array(buffer));
  if (
    !detected ||
    !AVATAR_ALLOWED_MIME.includes(
      detected as (typeof AVATAR_ALLOWED_MIME)[number],
    )
  ) {
    return { ok: false, error: "仅支持 JPG / PNG / WebP" };
  }

  const ext = resolveExtension(detected);
  const path = `${userId}/${Date.now()}.${ext}`;

  try {
    const client = options?.useServiceRole
      ? createAdminClient()
      : await createClient();

    const { error: uploadError } = await client.storage
      .from(AVATAR_BUCKET)
      .upload(path, buffer, {
        contentType: detected,
        upsert: true,
      });

    if (uploadError) {
      return { ok: false, error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = client.storage.from(AVATAR_BUCKET).getPublicUrl(path);

    return { ok: true, publicUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "头像上传失败",
    };
  }
}
