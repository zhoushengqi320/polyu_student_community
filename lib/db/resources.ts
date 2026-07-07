import {
  DEFAULT_SCHOOL_ID,
  RESOURCE_CATEGORIES,
} from "@/constants/categories";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { mapResource, mapResourceCategory } from "@/lib/db/mappers/resource";
import { matchesSearch } from "@/lib/utils/search";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  type Resource,
  type ResourceCategory,
  type ResourceFilters,
  type ResourceGroup,
} from "@/types/resource";

const FALLBACK_RESOURCES = [
  {
    categoryId: "official" as const,
    title: "Learn@PolyU / Blackboard",
    description: "看课程 PPT、作业、quiz、announcement",
    url: "https://learn.polyu.edu.hk/",
    sortOrder: 0,
  },
  {
    categoryId: "official" as const,
    title: "eStudent",
    description: "查成绩、选课、学业申请、学生记录",
    url: "https://www38.polyu.edu.hk/eStudent/",
    sortOrder: 1,
  },
  {
    categoryId: "official" as const,
    title: "POSS",
    description: "学生活动、预约、career、counselling、locker、设施服务",
    url: "https://www40.polyu.edu.hk/poss/secure/login/loginhome.do",
    sortOrder: 2,
  },
  {
    categoryId: "academic" as const,
    title: "PolyU Library",
    description: "图书馆、论文数据库、exam papers、course resources",
    url: "https://www.lib.polyu.edu.hk/",
    sortOrder: 0,
  },
  {
    categoryId: "academic" as const,
    title: "Academic Calendar",
    description: "校历、学期安排、考试周、假期",
    url: "https://www.polyu.edu.hk/ar/students-in-taught-programmes/academic-calendar/",
    sortOrder: 1,
  },
  {
    categoryId: "academic" as const,
    title: "Room Search / Learning Spaces",
    description: "查教室、课室设备、容量",
    url: "https://www.polyu.edu.hk/learningspaces/",
    sortOrder: 2,
  },
  {
    categoryId: "tools" as const,
    title: "PolyU Connect Email / Outlook",
    description: "学生邮箱",
    url: "https://www.polyu.edu.hk/connectmail",
    sortOrder: 0,
  },
  {
    categoryId: "tools" as const,
    title: "PUsecure Identity Portal",
    description: "注册/管理 NetID、改 NetPassword",
    url: "https://idportal.polyu.edu.hk/",
    sortOrder: 1,
  },
  {
    categoryId: "tools" as const,
    title: "ITS HelpCentre / ServiceDesk",
    description: "IT 支持、Wi-Fi、VPN、账号问题",
    url: "https://www.polyu.edu.hk/itservicedesk",
    sortOrder: 2,
  },
  {
    categoryId: "career" as const,
    title: "PolyU Job Board",
    description: "找 internship、part-time、graduate job",
    url: "https://jobboard-sao.polyu.edu.hk/",
    sortOrder: 0,
  },
  {
    categoryId: "life" as const,
    title: "Campus Map",
    description: "校园地图、找 building",
    url: "https://www.polyu.edu.hk/campus-map/",
    sortOrder: 0,
  },
  {
    categoryId: "life" as const,
    title: "Sports Facilities Booking",
    description: "预约体育设施",
    url: "https://www.polyu.edu.hk/sao/counselling-and-wellness-section/sports-facilities/online-booking/",
    sortOrder: 1,
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
          (resource: Resource) =>
            matchesSearch(resource.title, searchQuery) ||
            matchesSearch(resource.description, searchQuery),
        )
      : mappedResources;

    const groups = (categories ?? []).map(mapResourceCategory).map((category: ResourceCategory) => ({
      ...category,
      resources: filteredResources.filter(
        (resource: Resource) => resource.categoryId === category.id,
      ),
    }));

    if (filters.categoryId) {
      return groups.filter((group: ResourceGroup) => group.id === filters.categoryId);
    }

    if (searchQuery) {
      return groups.filter((group: ResourceGroup) => group.resources.length > 0);
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
