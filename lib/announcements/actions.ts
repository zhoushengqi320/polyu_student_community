"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/session";
import {
  getAnnouncementById,
  saveAnnouncement,
  deleteAnnouncement,
  hideAnnouncement,
  updatePublishedAnnouncement,
} from "@/lib/db/announcements";
import { type AnnouncementFormState } from "@/lib/announcements/actionTypes";
import { extractAnnouncementFormValues } from "@/lib/announcements/form";
import { ROUTES } from "@/constants/routes";
import { ANNOUNCEMENT_DEFAULT_DURATION_HOURS } from "@/constants/announcements";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { addHoursToIso } from "@/lib/utils/announcementDateTime";

const optionalIsoDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  });

const importanceSchema = z.enum(["normal", "important"]);

const announcementCategorySchema = z.enum([
  "activity",
  "maintenance",
  "update",
  "general",
]);

const saveAnnouncementSchema = z
  .object({
    announcementId: z.string().uuid("无效的公告 ID").optional(),
    title: z.string().trim().min(2, "标题至少 2 个字").max(120),
    body: z.string().trim().min(4, "正文至少 4 个字").max(500),
    linkUrl: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((value) => (value ? value : null))
      .refine(
        (value) =>
          !value ||
          value.startsWith("/") ||
          z.string().url().safeParse(value).success,
        {
          message: "链接格式不正确",
        },
      ),
    linkLabel: z
      .string()
      .trim()
      .max(40)
      .optional()
      .nullable()
      .transform((value) => (value ? value : null)),
    category: announcementCategorySchema,
    importance: importanceSchema,
    isPinned: z
      .string()
      .optional()
      .transform((value) => value === "on" || value === "true"),
    scheduleDelay: z
      .string()
      .optional()
      .transform((value) => value === "on" || value === "true"),
    publishedAt: optionalIsoDate,
    endsAt: optionalIsoDate,
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    const compareStart = data.scheduleDelay && data.publishedAt
      ? new Date(data.publishedAt)
      : now;
    const endsAt = data.endsAt
      ? new Date(data.endsAt)
      : new Date(addHoursToIso(compareStart.toISOString(), ANNOUNCEMENT_DEFAULT_DURATION_HOURS));

    if (endsAt <= compareStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: data.scheduleDelay
          ? "展示结束时间须晚于预发布时间"
          : "展示结束时间须晚于当前时间",
      });
    }

    if (data.scheduleDelay) {
      if (!data.publishedAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["publishedAt"],
          message: "请选择预发布时间",
        });
        return;
      }

      const publishAt = new Date(data.publishedAt);
      if (publishAt <= now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["publishedAt"],
          message: "预发布时间须晚于当前时间",
        });
      }
    }
  });

const publishedEditSchema = z.object({
  announcementId: z.string().uuid("无效的公告 ID"),
  importance: importanceSchema,
  endsAt: z
    .string()
    .trim()
    .min(1, "请选择展示结束时间")
    .transform((value) => {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    })
    .refine((value): value is string => value !== null, {
      message: "时间格式不正确",
    }),
});

function revalidateAnnouncementPaths() {
  revalidatePath(ROUTES.home, "page");
  revalidatePath(ROUTES.admin, "page");
}

function mapFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function resolveEndsAt(
  endsAt: string | null | undefined,
  compareStartIso: string,
): string {
  if (endsAt) {
    return endsAt;
  }
  return addHoursToIso(compareStartIso, ANNOUNCEMENT_DEFAULT_DURATION_HOURS);
}

function parseAnnouncementForm(formData: FormData) {
  const values = extractAnnouncementFormValues(formData);
  return {
    announcementId: values.announcementId,
    title: values.title,
    body: values.body,
    linkUrl: values.linkUrl || null,
    linkLabel: values.linkLabel || null,
    category: values.category,
    importance: values.importance,
    isPinned: values.isPinned ? "on" : undefined,
    scheduleDelay: values.scheduleDelay ? "on" : undefined,
    publishedAt: values.publishedAt || null,
    endsAt: values.endsAt || null,
    publishedEditMode: values.publishedEditMode ? "on" : undefined,
  };
}

export async function saveAnnouncementAction(
  _prev: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  const admin = await requireAdmin();
  const submittedValues = extractAnnouncementFormValues(formData);
  const raw = parseAnnouncementForm(formData);

  if (raw.publishedEditMode && raw.announcementId) {
    const parsed = publishedEditSchema.safeParse({
      announcementId: raw.announcementId,
      importance: raw.importance,
      endsAt: submittedValues.endsAt,
    });

    if (!parsed.success) {
      return {
        fieldErrors: mapFieldErrors(parsed.error.issues),
        values: submittedValues,
      };
    }

    try {
      await updatePublishedAnnouncement(
        parsed.data.announcementId,
        {
          importance: parsed.data.importance,
          endsAt: parsed.data.endsAt,
        },
        admin.id,
      );
      revalidateAnnouncementPaths();
      return { success: "公告已更新", announcementId: parsed.data.announcementId };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "更新失败，请稍后重试",
        values: submittedValues,
      };
    }
  }

  const parsed = saveAnnouncementSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      fieldErrors: mapFieldErrors(parsed.error.issues),
      values: submittedValues,
    };
  }

  const nowIso = new Date().toISOString();
  const startsAt =
    parsed.data.scheduleDelay && parsed.data.publishedAt
      ? parsed.data.publishedAt
      : nowIso;
  const endsAt = resolveEndsAt(parsed.data.endsAt, startsAt);

  if (parsed.data.announcementId) {
    const existing = await getAnnouncementById(parsed.data.announcementId);
    if (existing?.status === CONTENT_STATUS.published) {
      return {
        error: "已发布公告仅可延长结束时间或修改重要等级",
        values: submittedValues,
      };
    }
  }

  try {
    const announcementId = await saveAnnouncement(
      {
        title: parsed.data.title,
        body: parsed.data.body,
        linkUrl: parsed.data.linkUrl,
        linkLabel: parsed.data.linkLabel,
        category: parsed.data.category,
        importance: parsed.data.importance,
        isPinned: parsed.data.isPinned,
        scheduleDelay: parsed.data.scheduleDelay,
        publishedAt: parsed.data.publishedAt,
        startsAt,
        endsAt,
      },
      admin.id,
      parsed.data.announcementId,
    );
    revalidateAnnouncementPaths();
    return {
      success: parsed.data.scheduleDelay ? "公告已进入预发布队列" : "公告已发布",
      announcementId,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存失败，请稍后重试",
      values: submittedValues,
    };
  }
}

export async function hideAnnouncementAction(
  _prev: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  const admin = await requireAdmin();
  const announcementId = String(formData.get("announcementId") ?? "");
  const parsed = z.string().uuid().safeParse(announcementId);

  if (!parsed.success) {
    return { error: "无效的公告 ID" };
  }

  try {
    await hideAnnouncement(parsed.data, admin.id);
    revalidateAnnouncementPaths();
    return { success: "公告已隐藏" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "隐藏失败，请稍后重试",
    };
  }
}

export async function deleteAnnouncementAction(
  _prev: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  const admin = await requireAdmin();
  const announcementId = String(formData.get("announcementId") ?? "");
  const parsed = z.string().uuid().safeParse(announcementId);

  if (!parsed.success) {
    return { error: "无效的公告 ID" };
  }

  try {
    await deleteAnnouncement(parsed.data, admin.id);
    revalidateAnnouncementPaths();
    return { success: "公告已删除" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "删除失败，请稍后重试",
    };
  }
}
