import { getSessionUser } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/db/notifications";
import { isFeatureEnabled } from "@/constants/features";
import { NavbarContent } from "@/components/layout/NavbarContent";

export async function Navbar() {
  const user = await getSessionUser();
  const unreadNotificationCount =
    user && isFeatureEnabled("notifications")
      ? await getUnreadNotificationCount(user.id)
      : 0;

  return (
    <NavbarContent
      user={user}
      unreadNotificationCount={unreadNotificationCount}
    />
  );
}
