import Link from "next/link";
import { NAV_ITEMS, ROUTES } from "@/constants/routes";
import { SITE_NAME, SCHOOL_NAME } from "@/constants/site";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{SITE_NAME}</p>
          <p className="text-sm text-muted-foreground">
            {SCHOOL_NAME}学生社区 · 课程 · 攻略 · 生活
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {NAV_ITEMS.slice(0, 4).map((item) => (
            <Link key={item.key} href={item.route} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
          <Link href={ROUTES.admin} className="hover:text-foreground">
            管理后台
          </Link>
        </div>
      </div>
    </footer>
  );
}
