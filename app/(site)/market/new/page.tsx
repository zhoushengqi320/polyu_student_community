import { notFound, redirect } from "next/navigation";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { MarketListingForm } from "@/components/market/MarketListingForm";
import { isFeatureEnabled } from "@/constants/features";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/utils/permissions";

export default async function NewMarketListingPage() {
  if (!isFeatureEnabled("marketplace")) {
    notFound();
  }

  const user = await getSessionUser();

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.market.new)}`);
  }

  if (!can(user, "content:create:market")) {
    return (
      <ModulePageShell
        title="发布闲置"
        description="二手市集"
        back={{ href: ROUTES.market.list, label: "二手市集" }}
      >
        <p className="text-sm text-muted-foreground">
          当前账号无法发布闲置。需使用已认证的理大账号。
        </p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      title="发布闲置"
      description="二手市集 · 分享教材、电子产品等校园闲置"
      back={{ href: ROUTES.market.list, label: "二手市集" }}
    >
      <MarketListingForm mode="create" />
    </ModulePageShell>
  );
}
