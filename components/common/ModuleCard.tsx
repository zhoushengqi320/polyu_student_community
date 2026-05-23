import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Globe,
  MessageSquare,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { type ModuleIconName } from "@/constants/modules";
import { type ModuleKey } from "@/types/common";
import { cn } from "@/lib/utils/cn";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MODULE_ICONS = {
  BookOpen,
  GraduationCap,
  UtensilsCrossed,
  Globe,
  Users,
  MessageSquare,
} as const;

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
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle className="group-hover:text-primary">{label}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <span className="text-sm font-medium text-primary">进入模块</span>
        </CardContent>
      </Card>
    </Link>
  );
}
