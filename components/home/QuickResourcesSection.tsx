import { ExternalLink } from "lucide-react";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { HomeSectionShell } from "@/components/home/HomeSectionShell";
import { ROUTES } from "@/constants/routes";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type HomeQuickResource, type HomeSectionResult } from "@/types/home";

type QuickResourcesSectionProps = {
  result: HomeSectionResult<HomeQuickResource>;
};

export function QuickResourcesSection({ result }: QuickResourcesSectionProps) {
  return (
    <HomeSectionShell
      title="常用网站"
      description="PolyU 学生高频使用的官方工具与网站。"
      href={ROUTES.resources.list}
    >
      {result.error ? (
        <HomeEmptyState
          error
          title="常用网站加载失败"
          description="请稍后刷新页面重试。"
        />
      ) : result.items.length === 0 ? (
        <HomeEmptyState
          title="暂无常用网站"
          description="配置 resources 数据后会在这里显示快捷入口。"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {result.items.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="group block h-full min-w-0"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-start justify-between gap-2 text-base leading-snug">
                    <span className="line-clamp-2 group-hover:text-primary">
                      {resource.title}
                    </span>
                    <ExternalLink
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </CardTitle>
                  {resource.description ? (
                    <CardDescription className="line-clamp-3">
                      {resource.description}
                    </CardDescription>
                  ) : null}
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>
      )}
    </HomeSectionShell>
  );
}
