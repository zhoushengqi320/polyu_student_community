import Link from "next/link";
import { Search } from "lucide-react";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";

  return (
    <ModulePageShell
      title="全站搜索"
      description="搜索课程、攻略、帖子与常用资源"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-xl border bg-card px-6 py-12 text-center">
        <Search className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">全站搜索功能开发中</h2>
          <p className="text-sm text-muted-foreground">
            首页搜索框已预留入口。后续会在这里统一搜索课程、攻略、讨论和资源。
          </p>
          {query ? (
            <p className="text-sm">
              当前关键词：<span className="font-medium text-foreground">{query}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href={ROUTES.courses.list}>先去查课程</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.guides.list}>先看攻略</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.home}>返回首页</Link>
          </Button>
        </div>
      </div>
    </ModulePageShell>
  );
}
