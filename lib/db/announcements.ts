import {
  ANNOUNCEMENT_CATEGORY_IDS,
  ANNOUNCEMENT_IMPORTANCE_IDS,
  ANNOUNCEMENT_STATUS,
  normalizeAnnouncementImportance,
} from "@/constants/announcements";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { createAdminAction } from "@/lib/db/reports";
import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  type AdminAnnouncement,
  type SiteAnnouncement,
} from "@/types/announcement";

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  link_url: string | null;
  link_label: string | null;
  category: string;
  variant: string;
  is_pinned: boolean;
  status: string;
  published_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AnnouncementInput = {
  title: string;
  body: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  category: (typeof ANNOUNCEMENT_CATEGORY_IDS)[number];
  importance: (typeof ANNOUNCEMENT_IMPORTANCE_IDS)[number];
  isPinned: boolean;
  scheduleDelay: boolean;
  publishedAt?: string | null;
  startsAt: string;
  endsAt: string;
};

export type PublishedAnnouncementUpdateInput = {
  importance: (typeof ANNOUNCEMENT_IMPORTANCE_IDS)[number];
  endsAt: string;
};

function mapAnnouncement(row: AnnouncementRow): SiteAnnouncement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    linkUrl: row.link_url,
    linkLabel: row.link_label,
    category: row.category as SiteAnnouncement["category"],
    importance: normalizeAnnouncementImportance(row.variant),
    isPinned: row.is_pinned,
    status: row.status as SiteAnnouncement["status"],
    publishedAt: row.published_at,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function buildAnnouncementPayload(input: AnnouncementInput) {
  const now = new Date().toISOString();

  if (input.scheduleDelay) {
    return {
      status: ANNOUNCEMENT_STATUS.scheduled,
      published_at: input.publishedAt,
    };
  }

  return {
    status: CONTENT_STATUS.published,
    published_at: now,
  };
}

/** 到期的预发布公告自动转为已发布 */
export async function publishDueAnnouncements(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const nowIso = new Date().toISOString();

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("announcements")
      .select("id")
      .eq("status", ANNOUNCEMENT_STATUS.scheduled)
      .is("deleted_at", null)
      .lte("published_at", nowIso);

    if (error) {
      console.error("Failed to query due announcements:", error);
      return 0;
    }

    const ids = ((data ?? []) as { id: string }[]).map((row) => row.id);
    if (ids.length === 0) {
      return 0;
    }

    const { error: updateError } = await admin
      .from("announcements")
      .update({ status: CONTENT_STATUS.published })
      .in("id", ids);

    if (updateError) {
      console.error("Failed to publish due announcements:", updateError);
      return 0;
    }

    return ids.length;
  } catch (error) {
    console.error("Failed to publish due announcements:", error);
    return 0;
  }
}

export async function getAnnouncementById(
  id: string,
): Promise<AdminAnnouncement | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapAnnouncement(data as AnnouncementRow);
}

export async function listActiveAnnouncements(): Promise<SiteAnnouncement[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null)
    .lte("published_at", nowIso)
    .lte("starts_at", nowIso)
    .gt("ends_at", nowIso)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Failed to list active announcements:", error);
    return [];
  }

  return (data as AnnouncementRow[]).map(mapAnnouncement);
}

export async function listAnnouncementsForAdmin(): Promise<AdminAnnouncement[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  await publishDueAnnouncements();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new DbError(error.message);
  }

  return (data as AnnouncementRow[]).map(mapAnnouncement);
}

export async function saveAnnouncement(
  input: AnnouncementInput,
  adminId: string,
  id?: string,
): Promise<string> {
  const supabase = await createClient();
  const publishPayload = buildAnnouncementPayload(input);

  const rowPayload = {
    title: input.title,
    body: input.body,
    link_url: input.linkUrl ?? null,
    link_label: input.linkLabel ?? null,
    category: input.category,
    variant: input.importance,
    is_pinned: input.isPinned,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    ...publishPayload,
  };

  if (id) {
    const existing = await getAnnouncementById(id);
    if (existing?.status === CONTENT_STATUS.published) {
      throw new DbError("已发布公告请使用受限编辑");
    }

    const { error } = await supabase
      .from("announcements")
      .update(rowPayload)
      .eq("id", id)
      .is("deleted_at", null);

    if (error) {
      throw new DbError(error.message);
    }

    await createAdminAction({
      adminId,
      action: input.scheduleDelay
        ? "schedule_announcement"
        : "update_announcement",
      targetType: "post",
      targetId: id,
      metadata: { title: input.title },
    });

    return id;
  }

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      ...rowPayload,
      created_by: adminId,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "保存公告失败");
  }

  await createAdminAction({
    adminId,
    action: input.scheduleDelay
      ? "schedule_announcement"
      : "create_announcement",
    targetType: "post",
    targetId: data.id,
    metadata: { title: input.title },
  });

  return data.id;
}

export async function updatePublishedAnnouncement(
  id: string,
  input: PublishedAnnouncementUpdateInput,
  adminId: string,
): Promise<void> {
  const existing = await getAnnouncementById(id);
  if (!existing) {
    throw new DbError("公告不存在");
  }

  if (existing.status !== CONTENT_STATUS.published) {
    throw new DbError("仅已发布公告可使用受限编辑");
  }

  if (!existing.endsAt) {
    throw new DbError("公告数据异常");
  }

  const currentEndsAt = new Date(existing.endsAt);
  const nextEndsAt = new Date(input.endsAt);

  if (nextEndsAt < currentEndsAt) {
    throw new DbError("展示结束时间只能延长，不能缩短");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({
      variant: input.importance,
      ends_at: input.endsAt,
    })
    .eq("id", id)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null);

  if (error) {
    throw new DbError(error.message);
  }

  await createAdminAction({
    adminId,
    action: "update_announcement",
    targetType: "post",
    targetId: id,
    metadata: { title: existing.title, publishedEdit: true },
  });
}

export async function hideAnnouncement(
  id: string,
  adminId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ status: CONTENT_STATUS.hidden })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new DbError(error.message);
  }

  await createAdminAction({
    adminId,
    action: "hide_announcement",
    targetType: "post",
    targetId: id,
  });
}

export async function deleteAnnouncement(
  id: string,
  adminId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("announcements")
    .update({
      deleted_at: new Date().toISOString(),
      status: CONTENT_STATUS.removed,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }

  if (!data) {
    throw new DbError("公告不存在或已删除");
  }

  await createAdminAction({
    adminId,
    action: "delete_announcement",
    targetType: "post",
    targetId: id,
  });
}
