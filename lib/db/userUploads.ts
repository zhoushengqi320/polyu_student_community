import {
  USER_UPLOAD_LIMITS,
  type UserUploadModule,
} from "@/constants/userUploads";
import { createAdminClient } from "@/lib/supabase/admin";
import { DbError } from "@/lib/db/shared";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type UserUploadRecord } from "@/types/userUpload";

type UserUploadRow = {
  id: string;
  user_id: string;
  storage_bucket: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  byte_size: number;
  module: string;
  status: string;
  target_type: string | null;
  target_id: string | null;
  alt_text: string | null;
  created_at: string;
  attached_at: string | null;
  expires_at: string;
};

function mapRow(row: UserUploadRow): UserUploadRecord {
  return {
    id: row.id,
    userId: row.user_id,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    module: row.module as UserUploadRecord["module"],
    status: row.status as UserUploadRecord["status"],
    targetType: row.target_type,
    targetId: row.target_id,
    altText: row.alt_text,
    createdAt: row.created_at,
    attachedAt: row.attached_at,
    expiresAt: row.expires_at,
  };
}

export async function createPendingUserUpload(input: {
  userId: string;
  storageBucket: string;
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  byteSize: number;
  module: UserUploadModule;
  altText?: string | null;
}): Promise<UserUploadRecord> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const admin = createAdminClient();
  const expiresAt = new Date(
    Date.now() + USER_UPLOAD_LIMITS.pendingTtlHours * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await admin
    .from("user_uploads")
    .insert({
      user_id: input.userId,
      storage_bucket: input.storageBucket,
      storage_path: input.storagePath,
      public_url: input.publicUrl,
      mime_type: input.mimeType,
      byte_size: input.byteSize,
      module: input.module,
      status: "pending",
      alt_text: input.altText?.trim() || null,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "记录上传失败", "VALIDATION");
  }

  return mapRow(data as UserUploadRow);
}

export async function listPendingUserUploadsForUser(
  userId: string,
  uploadIds: string[],
): Promise<UserUploadRecord[]> {
  if (!isSupabaseConfigured() || uploadIds.length === 0) {
    return [];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_uploads")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .in("id", uploadIds);

  if (error) {
    throw new DbError(error.message, "VALIDATION");
  }

  const rows = (data ?? []) as UserUploadRow[];
  const byId = new Map(rows.map((row) => [row.id, mapRow(row)]));

  return uploadIds
    .map((id) => byId.get(id))
    .filter((item): item is UserUploadRecord => Boolean(item));
}

export async function attachUserUploads(input: {
  userId: string;
  uploadIds: string[];
  targetType: string;
  targetId: string;
  module: UserUploadModule;
}): Promise<UserUploadRecord[]> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  if (input.uploadIds.length > USER_UPLOAD_LIMITS.maxFilesPerSubmit) {
    throw new DbError(
      `最多绑定 ${USER_UPLOAD_LIMITS.maxFilesPerSubmit} 张图片`,
      "VALIDATION",
    );
  }

  const pending = await listPendingUserUploadsForUser(
    input.userId,
    input.uploadIds,
  );

  if (pending.length !== input.uploadIds.length) {
    throw new DbError("部分图片无效或已过期，请重新上传", "VALIDATION");
  }

  if (pending.some((item) => item.module !== input.module)) {
    throw new DbError("图片模块不匹配", "VALIDATION");
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();

  const { error } = await admin
    .from("user_uploads")
    .update({
      status: "attached",
      target_type: input.targetType,
      target_id: input.targetId,
      attached_at: now,
    })
    .eq("user_id", input.userId)
    .eq("status", "pending")
    .in("id", input.uploadIds);

  if (error) {
    throw new DbError(error.message, "VALIDATION");
  }

  return pending.map((item) => ({
    ...item,
    status: "attached" as const,
    targetType: input.targetType,
    targetId: input.targetId,
    attachedAt: now,
  }));
}

/** 软删除 pending 上传（用户从表单移除时），并清理 Storage 文件 */
export async function cancelPendingUserUpload(
  userId: string,
  uploadId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_uploads")
    .select("storage_bucket, storage_path")
    .eq("id", uploadId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (!data) {
    return;
  }

  await admin
    .from("user_uploads")
    .update({ status: "deleted" })
    .eq("id", uploadId)
    .eq("user_id", userId)
    .eq("status", "pending");

  await admin.storage
    .from(data.storage_bucket)
    .remove([data.storage_path]);
}
