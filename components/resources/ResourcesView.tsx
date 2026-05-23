"use client";

import { useMemo } from "react";
import { Globe } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { SearchBar } from "@/components/common/SearchBar";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { useSearch } from "@/hooks/useSearch";
import { type ResourceGroup } from "@/types/resource";

type ResourcesViewProps = {
  groups: ResourceGroup[];
  dataSource?: "supabase" | "fallback";
};

export function ResourcesView({ groups, dataSource = "fallback" }: ResourcesViewProps) {
  const flatResources = useMemo(
    () => groups.flatMap((group) => group.resources),
    [groups],
  );

  const { query, setQuery, filteredItems } = useSearch(
    flatResources,
    (resource) => `${resource.title} ${resource.description ?? ""}`,
  );

  const filteredGroups = useMemo(() => {
    if (!query.trim()) {
      return groups;
    }

    const visibleIds = new Set(filteredItems.map((item) => item.id));

    return groups
      .map((group) => ({
        ...group,
        resources: group.resources.filter((resource) => visibleIds.has(resource.id)),
      }))
      .filter((group) => group.resources.length > 0);
  }, [filteredItems, groups, query]);

  const totalCount = flatResources.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="搜索网站名称或描述..."
          className="sm:max-w-md"
        />
        <p className="text-sm text-muted-foreground">
          共 {totalCount} 个链接
          {dataSource === "fallback" ? " · 本地示例数据" : ""}
        </p>
      </div>

      {filteredGroups.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="未找到匹配的网站"
          description="试试其他关键词，或浏览全部分类。"
        />
      ) : (
        <div className="space-y-10">
          {filteredGroups.map((group) => (
            <section key={group.id} className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">{group.label}</h2>
                <span className="text-sm text-muted-foreground">
                  {group.resources.length} 个
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
