"use client";

import { useRouter } from "next/navigation";
import { usePostgresChanges } from "@/hooks/usePostgresChanges";

type NavbarLiveSyncProps = {
  userId: string | null;
  messagingEnabled: boolean;
  notificationsEnabled: boolean;
};

export function NavbarLiveSync({
  userId,
  messagingEnabled,
  notificationsEnabled,
}: NavbarLiveSyncProps) {
  const router = useRouter();

  usePostgresChanges(
    Boolean(userId) && notificationsEnabled,
    `navbar-notifications:${userId ?? "guest"}`,
    userId
      ? [
          {
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
        ]
      : [],
    () => router.refresh(),
  );

  usePostgresChanges(
    Boolean(userId) && messagingEnabled,
    `navbar-messages:${userId ?? "guest"}`,
    userId
      ? [
          { table: "messages", event: "INSERT" },
          { table: "messages", event: "UPDATE" },
          {
            table: "conversation_members",
            filter: `user_id=eq.${userId}`,
          },
        ]
      : [],
    () => router.refresh(),
  );

  return null;
}
