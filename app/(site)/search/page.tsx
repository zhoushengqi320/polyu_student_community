import { ModulePageShell } from "@/components/common/ModulePageShell";
import { SearchPageClient } from "@/components/search/SearchPageClient";
import { searchGlobal } from "@/lib/db/search";
import {
  searchQuerySchema,
  type SearchResultTypeFilter,
} from "@/lib/validations/searchSchema";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const parsed = searchQuerySchema.safeParse({
    q: params.q ?? "",
    type: params.type ?? "all",
  });

  const query = parsed.success ? parsed.data.q : "";
  const type = parsed.success ? parsed.data.type : "all";
  const result = await searchGlobal({
    query,
    type: type as SearchResultTypeFilter,
  });

  return (
    <ModulePageShell
      title="全站搜索"
      description="搜索课程、学习指南、生活指南、讨论帖、吃喝玩乐与入学攻略"
      back={{ href: "/", label: "首页" }}
    >
      <SearchPageClient result={result} />
    </ModulePageShell>
  );
}
