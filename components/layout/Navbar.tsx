import { getSessionUser } from "@/lib/auth/session";
import { countUnrepliedFeedbackPosts } from "@/lib/db/feedback";
import { getUnreadNotificationCount } from "@/lib/db/notifications";
import { isFeatureEnabled } from "@/constants/features";
import { NavbarContent } from "@/components/layout/NavbarContent";
import { isAdmin } from "@/lib/utils/permissions";

export async function Navbar() {
  const user = await getSessionUser();
  const unreadNotificationCount =
    user && isFeatureEnabled("notifications")
      ? await getUnreadNotificationCount(user.id)
      : 0;
  const unreadFeedbackCount =
    user && isAdmin(user) ? await countUnrepliedFeedbackPosts() : 0;

  return (
    <NavbarContent
      user={user}
      unreadNotificationCount={unreadNotificationCount}
      unreadFeedbackCount={unreadFeedbackCount}
    />
  );
}
