"use server";

import { revalidatePath } from "next/cache";
import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { ROUTES } from "@/constants/routes";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { requireAdmin } from "@/lib/admin/session";
import { logAdminAction } from "@/lib/db/reports";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isPdfBytes } from "@/lib/utils/fileMagic";

const BUCKET = "course_pdfs";
const MAX_BYTES = 50 * 1024 * 1024;

export type UploadCoursePdfResult =
  | { success: true; publicUrl: string; code: string }
  | { success: false; error: string };

function sanitizeCourseCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function sanitizeFileName(name: string) {
  return name
    .trim()
    .replace(/[^\w.\-()+\u4e00-\u9fff]/g, "_")
    .replace(/_+/g, "_");
}

export async function uploadCoursePdfAction(
  formData: FormData,
): Promise<UploadCoursePdfResult> {
  try {
    const admin = await requireAdmin();
    const code = sanitizeCourseCode(String(formData.get("courseCode") ?? ""));
    const file = formData.get("file");

    if (!code || code.length < 2) {
      return { success: false, error: "请填写有效的课程代码" };
    }

    if (!(file instanceof File)) {
      return { success: false, error: "请选择 PDF 文件" };
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return { success: false, error: "仅支持 PDF 文件" };
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return { success: false, error: "PDF 大小需在 50MB 以内" };
    }

    const fileName = sanitizeFileName(file.name || `${code}.pdf`);
    const storagePath = `${code}/${fileName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    if (!isPdfBytes(bytes)) {
      return { success: false, error: "文件内容不是有效的 PDF" };
    }

    let publicUrl: string | null = null;

    try {
      const supabase = await createClient();
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      });

      if (!error) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        publicUrl = data.publicUrl;
      }
    } catch {
      // fall through to service role
    }

    if (!publicUrl) {
      const adminClient = createAdminClient();
      const { error } = await adminClient.storage.from(BUCKET).upload(storagePath, bytes, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data } = adminClient.storage.from(BUCKET).getPublicUrl(storagePath);
      publicUrl = data.publicUrl;
    }

    const supabase = await createClient();
    const { data: course, error: updateError } = await supabase
      .from("courses")
      .update({
        pdf_url: publicUrl,
        pdf_storage_path: `${BUCKET}/${storagePath}`,
        source_file_name: fileName,
        source_updated_at: new Date().toISOString(),
      })
      .eq("school_id", DEFAULT_SCHOOL_ID)
      .ilike("code", code)
      .select("id, code")
      .maybeSingle();

    if (updateError) {
      return {
        success: false,
        error: `PDF 已上传，但更新课程失败：${updateError.message}`,
      };
    }

    if (!course) {
      return {
        success: false,
        error: `PDF 已上传（${publicUrl}），但未找到课程代码 ${code}，请先在课程目录中创建该课程。`,
      };
    }

    if (!publicUrl) {
      return { success: false, error: "上传成功但无法生成公开链接" };
    }

    await logAdminAction({
      adminId: admin.id,
      action: "upload_course_pdf",
      targetType: TARGET_TYPES.course,
      targetId: String(course.id),
      metadata: { code: course.code, storagePath, publicUrl },
    });

    revalidatePath(ROUTES.admin);
    revalidatePath(ROUTES.courses.list);
    revalidatePath(ROUTES.courses.detail(String(course.code)));

    return {
      success: true,
      publicUrl,
      code: String(course.code),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "上传失败",
    };
  }
}
