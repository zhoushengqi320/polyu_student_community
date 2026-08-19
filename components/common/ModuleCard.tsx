import Link from "next/link";
import {
  BookOpen,
  CircleHelp,
  GraduationCap,
  House,
  MessageSquare,
  NotebookPen,
  UtensilsCrossed,
} from "lucide-react";
import { type ModuleIconName } from "@/constants/modules";
import { type ModuleKey } from "@/types/common";
import { cn } from "@/lib/utils/cn";
import { interactiveCardClassName } from "@/lib/utils/interactiveCard";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MODULE_ICONS = {
  BookOpen,
  GraduationCap,
  UtensilsCrossed,
  NotebookPen,
  House,
  MessageSquare,
  CircleHelp,
} as const satisfies Record<ModuleIconName, typeof BookOpen>;

type ModuleCardProps = {
  moduleKey: ModuleKey;
  route: string;
  label: string;
  description: string;
  icon: ModuleIconName;
  className?: string;
};

export function ModuleCard({
  route,
  label,
  description,
  icon,
  className,
}: ModuleCardProps) {
  const Icon = MODULE_ICONS[icon];

  return (
    <Link href={route} className={cn("group block h-full", className)}>
      <Card className={interactiveCardClassName("h-full")}>
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle className="transition-colors group-hover:text-primary">{label}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
