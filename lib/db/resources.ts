import {
  DEFAULT_SCHOOL_ID,
  RESOURCE_CATEGORIES,
} from "@/constants/categories";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { mapResource, mapResourceCategory } from "@/lib/db/mappers/resource";
import { matchesSearch } from "@/lib/utils/search";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type ResourceFilters, type ResourceGroup } from "@/types/resource";

const FALLBACK_RESOURCES = [
  {
    categoryId: "official" as const,
    title: "理工大学官网",
    description: "香港理工大学官方网站",
    url: "https://www.polyu.edu.hk",
    sortOrder: 0,
  },
  {
    categoryId: "official" as const,
    title: "学生信息系统",
    description: "查询成绩、课表与选课",
    url: "https://www38.polyu.edu.hk/eStudent/",
    sortOrder: 1,
  },
  {
    categoryId: "official" as const,
    title: "网上学习平台",
    description: "课程学习与作业提交",
    url: "https://learn.polyu.edu.hk",
    sortOrder: 2,
  },
  {
    categoryId: "academic" as const,
    title: "理大图书馆",
    description: "图书馆资源与数据库",
    url: "https://www.lib.polyu.edu.hk",
    sortOrder: 0,
  },
  {
    categoryId: "tools" as const,
    title: "学生邮箱",
    description: "理大学生电子邮件",
    url: "https://outlook.office.com",
    sortOrder: 0,
  },
  {
    categoryId: "career" as const,
    title: "职业策划及安放处",
    description: "就业与实习服务",
    url: "https://www.polyu.edu.hk/cpa",
    sortOrder: 0,
  },
];

function buildFallbackResourceGroups(filters: ResourceFilters = {}): ResourceGroup[] {
  const now = new Date().toISOString();

  return RESOURCE_CATEGORIES.map((category, index) => {
    const resources = FALLBACK_RESOURCES.filter((item) => {
      const search = filters.search ?? "";
      if (!search) {
        return item.categoryId === category.id;
      }

      return (
        item.categoryId === category.id &&
        (matchesSearch(item.title, search) ||
          matchesSearch(item.description, search))
      );
    }).map((item, resourceIndex) => ({
      id: `fallback-${category.id}-${resourceIndex}`,
      categoryId: item.categoryId,
      title: item.title,
      description: item.description,
      url: item.url,
      iconUrl: null,
      sortOrder: item.sortOrder,
      status: CONTENT_STATUS.published,
      createdAt: now,
      updatedAt: now,
    }));

    return {
      id: category.id,
      label: category.label,
      sortOrder: index,
      resources,
    };
  }).filter((group) => {
    if (filters.categoryId && group.id !== filters.categoryId) {
      return false;
    }

    if (filters.search) {
      return group.resources.length > 0;
    }

    return true;
  });
}

export async function listResourceGroups(
  filters: ResourceFilters = {},
): Promise<ResourceGroup[]> {
  if (!isSupabaseConfigured()) {
    return buildFallbackResourceGroups(filters);
  }

  try {
    const supabase = await createClient();

    let resourcesQuery = supabase
      .from("resources")
      .select("*")
      .eq("status", CONTENT_STATUS.published)
      .eq("school_id", DEFAULT_SCHOOL_ID)
      .order("sort_order", { ascending: true });

    if (filters.categoryId) {
      resourcesQuery = resourcesQuery.eq("category_id", filters.categoryId);
    }

    const [{ data: categories, error: categoriesError }, { data: resources, error: resourcesError }] =
      await Promise.all([
        supabase
          .from("resource_categories")
          .select("*")
          .eq("school_id", DEFAULT_SCHOOL_ID)
          .order("sort_order", { ascending: true }),
        resourcesQuery,
      ]);

    if (categoriesError || resourcesError) {
      console.error("Failed to fetch resources:", categoriesError ?? resourcesError);
      return buildFallbackResourceGroups(filters);
    }

    const mappedResources = (resources ?? []).map(mapResource);
    const searchQuery = filters.search?.trim() ?? "";

    const filteredResources = searchQuery
      ? mappedResources.filter(
          (resource) =>
            matchesSearch(resource.title, searchQuery) ||
            matchesSearch(resource.description, searchQuery),
        )
      : mappedResources;

    const groups = (categories ?? []).map(mapResourceCategory).map((category) => ({
      ...category,
      resources: filteredResources.filter(
        (resource) => resource.categoryId === category.id,
      ),
    }));

    if (filters.categoryId) {
      return groups.filter((group) => group.id === filters.categoryId);
    }

    if (searchQuery) {
      return groups.filter((group) => group.resources.length > 0);
    }

    return groups;
  } catch (error) {
    console.error("Supabase resources query failed:", error);
    return buildFallbackResourceGroups(filters);
  }
}

export async function listResources(filters: ResourceFilters = {}) {
  const groups = await listResourceGroups(filters);
  return groups.flatMap((group) => group.resources);
}
