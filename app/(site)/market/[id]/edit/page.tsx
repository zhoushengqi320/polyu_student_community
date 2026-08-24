import { notFound, redirect } from "next/navigation";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { MarketListingForm } from "@/components/market/MarketListingForm";
import { isFeatureEnabled } from "@/constants/features";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { getMarketListingById } from "@/lib/db/market";
import { canManageOwnContent } from "@/lib/utils/permissions";

type EditMarketListingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMarketListingPage({
  params,
}: EditMarketListingPageProps) {
  if (!isFeatureEnabled("marketplace")) {
    notFound();
  }

  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    redirect(
      `${ROUTES.login}?next=${encodeURIComponent(ROUTES.market.edit(id))}`,
    );
  }

  const listing = await getMarketListingById(id, { includeHidden: true });
  if (!listing || !canManageOwnContent(user, listing.userId)) {
    notFound();
  }

  return (
    <ModulePageShell
      title="编辑闲置"
      description="二手市集"
      back={{ href: ROUTES.market.detail(listing.id), label: "返回详情" }}
    >
      <MarketListingForm mode="edit" initial={listing} />
    </ModulePageShell>
  );
}
