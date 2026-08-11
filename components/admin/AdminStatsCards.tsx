import { FileText, Flag, Users, UserRoundCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type AdminStats } from "@/types/admin";

type AdminStatsCardsProps = {
  stats: AdminStats;
};

const STAT_ITEMS = [
  {
    key: "userCount" as const,
    label: "注册用户",
    icon: Users,
  },
  {
    key: "postCount" as const,
    label: "已发布帖子",
    icon: FileText,
  },
  {
    key: "pendingReportCount" as const,
    label: "待处理举报",
    icon: Flag,
  },
  {
    key: "pendingProfileReviewCount" as const,
    label: "待审资料",
    icon: UserRoundCheck,
  },
];

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_ITEMS.map(({ key, label, icon: Icon }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats[key].toLocaleString("zh-HK")}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
