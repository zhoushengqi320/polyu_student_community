import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type PageBackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

/** 返回上一级：文案为「返回{页面名}」 */
export function PageBackLink({ href, label, className }: PageBackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      返回{label}
    </Link>
  );
}
