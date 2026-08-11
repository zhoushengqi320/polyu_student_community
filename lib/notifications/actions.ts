"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/db/notifications";
import { ROUTES } from "@/constants/routes";

export async function markNotificationReadAction(
  notificationId: string,
): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    return;
  }

  await markNotificationRead(notificationId, user.id);
  revalidatePath(ROUTES.notifications);
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    return;
  }

  await markAllNotificationsRead(user.id);
  revalidatePath(ROUTES.notifications);
}
