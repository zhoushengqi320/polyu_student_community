import { notFound } from "next/navigation";
import { ContentViewTracker } from "@/components/common/ContentViewTracker";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { MarketDetailView } from "@/components/market/MarketDetailView";
import { isFeatureEnabled } from "@/constants/features";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { getMarketListingById } from "@/lib/db/market";
import { countReactions, hasReaction } from "@/lib/db/reactions";
import { can } from "@/lib/utils/permissions";

type MarketDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MarketDetailPage({
  params,
}: MarketDetailPageProps) {
  if (!isFeatureEnabled("marketplace")) {
    notFound();
  }

  const { id } = await params;
  const user = await getSessionUser();
  const listing = await getMarketListingById(id, {
    ownerId: user?.id,
  });

  if (!listing) {
    notFound();
  }

  const [isFavorited, favoriteCount] = await Promise.all([
    user
      ? hasReaction({
          userId: user.id,
          targetType: TARGET_TYPES.market_listing,
          targetId: listing.id,
          type: "favorite",
        })
      : Promise.resolve(false),
    countReactions({
      targetType: TARGET_TYPES.market_listing,
      targetId: listing.id,
      type: "favorite",
    }),
  ]);

  return (
    <ModulePageShell
      title={listing.title}
      description="二手市集 · 闲置详情"
      back={{ href: ROUTES.market.list, label: "二手市集" }}
    >
      <ContentViewTracker
        targetType={TARGET_TYPES.market_listing}
        targetId={listing.id}
      />
      <MarketDetailView
        listing={listing}
        canFavorite={can(user, "interaction:favorite")}
        isLoggedIn={Boolean(user)}
        isFavorited={isFavorited}
        favoriteCount={favoriteCount}
        isOwner={Boolean(user && user.id === listing.userId)}
        currentUserId={user?.id ?? null}
      />
    </ModulePageShell>
  );
}
