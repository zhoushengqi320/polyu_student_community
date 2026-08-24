import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketList } from "@/components/market/MarketList";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled } from "@/constants/features";
import {
  MARKET_CATEGORIES,
  MARKET_LISTING_STATUSES,
  MARKET_PAGE_SIZE,
  MARKET_SORT_OPTIONS,
  type MarketCategoryId,
  type MarketListingStatusId,
  type MarketSortId,
} from "@/constants/marketOptions";
import { MODULE_REGISTRY } from "@/constants/modules";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { listMarketListings } from "@/lib/db/market";
import { getModuleCreatePrompt } from "@/lib/utils/authPrompts";

type MarketPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
};

function parseCategory(value?: string): MarketCategoryId | undefined {
  if (!value) return undefined;
  return MARKET_CATEGORIES.some((item) => item.id === value)
    ? (value as MarketCategoryId)
    : undefined;
}

function parseStatus(value?: string): MarketListingStatusId | undefined {
  if (!value) return undefined;
  return MARKET_LISTING_STATUSES.some((item) => item.id === value)
    ? (value as MarketListingStatusId)
    : undefined;
}

function parseSort(value?: string): MarketSortId {
  if (!value) return "latest";
  return MARKET_SORT_OPTIONS.some((item) => item.id === value)
    ? (value as MarketSortId)
    : "latest";
}

export default async function MarketPage({ searchParams }: MarketPageProps) {
  if (!isFeatureEnabled("marketplace")) {
    notFound();
  }

  const params = await searchParams;
  const user = await getSessionUser();
  const category = parseCategory(params.category);
  const listingStatus = parseStatus(params.status);
  const sort = parseSort(params.sort);
  const search = params.q?.trim() || undefined;
  const page = Number(params.page ?? "1") || 1;

  const result = await listMarketListings({
    category,
    listingStatus,
    sort,
    search,
    page,
    pageSize: MARKET_PAGE_SIZE,
  });

  const publishPrompt = getModuleCreatePrompt(
    user,
    "market",
    {
      login: "登录后发布",
      banned: "账号受限",
      unverified: "认证后发布",
    },
    ROUTES.market.new,
  );
  const canPublish = !publishPrompt;

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.market.label}
      description={MODULE_REGISTRY.market.description}
      back={{ href: "/", label: "首页" }}
      actions={
        publishPrompt ? (
          <Button asChild variant="outline">
            <Link href={publishPrompt.href}>{publishPrompt.label}</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href={ROUTES.market.new}>发布闲置</Link>
          </Button>
        )
      }
    >
      <MarketList
        result={result}
        category={category}
        listingStatus={listingStatus}
        sort={sort}
        search={search}
        canPublish={canPublish}
        publishPrompt={publishPrompt}
      />
    </ModulePageShell>
  );
}
