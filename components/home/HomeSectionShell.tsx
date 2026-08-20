import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type HomeSectionShellProps = {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
  tourId?: string;
};

export function HomeSectionShell({
  title,
  description: _description,
  href,
  linkLabel = "查看更多",
  children,
  className,
  tourId,
}: HomeSectionShellProps) {
  return (
    <section data-tour={tourId} className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        </div>
        {href ? (
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href={href}>
              {linkLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
