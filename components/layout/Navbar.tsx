import { getSessionUser } from "@/lib/auth/session";
import { countUnrepliedFeedbackPosts } from "@/lib/db/feedback";
import { getUnreadNotificationCount } from "@/lib/db/notifications";
import { countUnreadMessages } from "@/lib/db/messages";
import { isFeatureEnabled } from "@/constants/features";
import { NavbarContent } from "@/components/layout/NavbarContent";
import { isAdmin } from "@/lib/utils/permissions";

export async function Navbar() {
  const user = await getSessionUser();
  const unreadNotificationCount =
    user && isFeatureEnabled("notifications")
      ? await getUnreadNotificationCount(user.id)
      : 0;
  const unreadMessageCount =
    user && isFeatureEnabled("messaging")
      ? await countUnreadMessages(user.id)
      : 0;
  const unreadFeedbackCount =
    user && isAdmin(user) ? await countUnrepliedFeedbackPosts() : 0;

  return (
    <NavbarContent
      user={user}
      unreadNotificationCount={unreadNotificationCount}
      unreadMessageCount={unreadMessageCount}
      unreadFeedbackCount={unreadFeedbackCount}
    />
  );
}
