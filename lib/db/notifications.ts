import { type NotificationType } from "@/constants/moderation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type Notification } from "@/types/notification";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    link: row.link,
    metadata: row.metadata,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      metadata: input.metadata ?? null,
    });

    if (error) {
      console.error("Failed to create notification:", error.message ?? error);
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function createNotifications(
  items: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    link?: string | null;
    metadata?: Record<string, unknown> | null;
  }>,
): Promise<void> {
  if (!isSupabaseConfigured() || items.length === 0) {
    return;
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert(
      items.map((item) => ({
        user_id: item.userId,
        type: item.type,
        title: item.title,
        body: item.body,
        link: item.link ?? null,
        metadata: item.metadata ?? null,
      })),
    );

    if (error) {
      console.error("Failed to create notifications:", error.message ?? error);
    }
  } catch (error) {
    console.error("Failed to create notifications:", error);
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function listNotifications(
  userId: string,
  limit = 30,
): Promise<Notification[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as NotificationRow[]).map(mapNotification);
}

export async function markNotificationRead(
  notificationId: string,
  userId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
