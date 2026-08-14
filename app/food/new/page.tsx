import { redirect } from "next/navigation";
import { FoodSubmitForm } from "@/components/food/FoodSubmitForm";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/utils/permissions";

export default async function NewFoodPlacePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.food.new)}`);
  }

  if (!can(user, "content:create:food")) {
    return (
      <ModulePageShell
        title="提交新地点"
        description="吃喝玩乐"
        back={{ href: ROUTES.food.list, label: "吃喝玩乐" }}
      >
        <p className="text-sm text-muted-foreground">当前账号无法提交地点。</p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      title="提交新地点"
      description="吃喝玩乐 · 分享校园及附近好去处"
      back={{ href: ROUTES.food.list, label: "吃喝玩乐" }}
    >
      <FoodSubmitForm />
    </ModulePageShell>
  );
}
