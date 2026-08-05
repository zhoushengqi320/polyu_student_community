import Link from "next/link";
import { HOME_DISCLAIMER } from "@/constants/home";
import { LEGAL_NAV_ITEMS } from "@/constants/legal";
import { SITE_NAME } from "@/constants/site";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container flex flex-col gap-6 py-8">
        <div>
          <p className="font-semibold">{SITE_NAME}</p>
          <p className="text-sm text-muted-foreground">
            {SITE_NAME} · 课程 · 学习 · 生活
          </p>
          <p className="mt-2 overflow-x-auto text-xs text-muted-foreground whitespace-nowrap">
            {HOME_DISCLAIMER}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 border-t pt-4 text-sm text-muted-foreground">
          {LEGAL_NAV_ITEMS.map((item) => (
            <Link
              key={item.slug}
              href={`/about/${item.slug}`}
              className="hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
