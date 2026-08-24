import { redirect } from "next/navigation";
import { NotificationList } from "@/components/notifications/NotificationList";
import { getSessionUser } from "@/lib/auth/session";
import { listNotifications } from "@/lib/db/notifications";
import { ROUTES } from "@/constants/routes";

export const metadata = {
  title: "通知 | PolyUHub",
};

export default async function NotificationsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const notifications = await listNotifications(user.id);

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">通知</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          互动消息（点赞、评论、回复、收藏）与系统处理结果
        </p>
      </div>
      <NotificationList notifications={notifications} userId={user.id} />
    </div>
  );
}
