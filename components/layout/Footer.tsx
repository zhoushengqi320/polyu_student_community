import Link from "next/link";
import { SiteLogo } from "@/components/brand/SiteLogo";
import { HOME_DISCLAIMER } from "@/constants/home";
import { LEGAL_NAV_ITEMS } from "@/constants/legal";
import { ROUTES } from "@/constants/routes";
import { SITE_BYLINE } from "@/constants/site";

const FOOTER_LINKS = [
  { label: "课程", href: ROUTES.courses.list },
  { label: "学习", href: ROUTES.study.list },
  { label: "生活", href: ROUTES.life.list },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer border-t border-primary/10 bg-gradient-to-b from-primary/5 to-muted/30">
      <div className="container flex flex-col gap-6 py-8">
        <div>
          <div className="mb-3 flex flex-col gap-1">
            <SiteLogo variant="footer" className="h-12 sm:h-14" />
            <p className="text-xs tracking-[0.08em] text-muted-foreground">
              {SITE_BYLINE}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted-foreground">
            {FOOTER_LINKS.map((item, index) => (
              <span key={item.href} className="inline-flex items-center">
                {index > 0 ? (
                  <span className="mx-1.5 text-muted-foreground/60" aria-hidden>
                    ·
                  </span>
                ) : null}
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {HOME_DISCLAIMER}
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGAL_NAV_ITEMS.map((item) => (
              <Link
                key={item.slug}
                href={`/about/${item.slug}`}
                className="hover:text-foreground"
              >
                {item.title}
              </Link>
            ))}
          </nav>
          <p className="text-xs">© {year}</p>
        </div>
      </div>
    </footer>
  );
}
