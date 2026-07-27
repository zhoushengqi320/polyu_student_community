import Link from "next/link";
import { NAV_ITEMS, ROUTES } from "@/constants/routes";
import { HOME_DISCLAIMER } from "@/constants/home";
import { SITE_NAME, SCHOOL_NAME } from "@/constants/site";
import { getSessionUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/utils/permissions";

export async function Footer() {
  const user = await getSessionUser();
  const showAdminLink = isAdmin(user);

  return (
    <footer className="border-t bg-muted/30">
      <div className="container flex flex-col gap-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="font-semibold">{SITE_NAME}</p>
            <p className="text-sm text-muted-foreground">
              {SCHOOL_NAME}学生社区 · 课程 · 攻略 · 生活
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {HOME_DISCLAIMER}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {NAV_ITEMS.slice(0, 4).map((item) => (
              <Link key={item.key} href={item.route} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
            {showAdminLink ? (
              <Link href={ROUTES.admin} className="hover:text-foreground">
                管理后台
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
