import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { SITE_LOGO_SRC, SITE_NAME } from "@/constants/site";
import { cn } from "@/lib/utils/cn";

type SiteLogoProps = {
  className?: string;
  /** 导航栏高度内展示；默认带首页链接 */
  href?: string | null;
  priority?: boolean;
};

export function SiteLogo({
  className,
  href = ROUTES.home,
  priority = false,
}: SiteLogoProps) {
  const image = (
    <Image
      src={SITE_LOGO_SRC}
      alt={SITE_NAME}
      width={160}
      height={160}
      priority={priority}
      className={cn("h-10 w-auto object-contain sm:h-11", className)}
    />
  );

  if (href === null) {
    return image;
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={SITE_NAME}
    >
      {image}
    </Link>
  );
}
