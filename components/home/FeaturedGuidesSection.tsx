import { GuideCard } from "@/components/guides/GuideCard";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { HomeSectionShell } from "@/components/home/HomeSectionShell";
import { ROUTES } from "@/constants/routes";
import { type HomeSectionResult } from "@/types/home";
import { type GuideListItem } from "@/types/guide";

type FeaturedGuidesSectionProps = {
  result: HomeSectionResult<GuideListItem>;
};

export function FeaturedGuidesSection({ result }: FeaturedGuidesSectionProps) {
  return (
    <HomeSectionShell
      title="新生必看攻略"
      description="入学、选课、校园系统与生活适应，从这里开始。"
      href={ROUTES.guides.list}
    >
      {result.error ? (
        <HomeEmptyState
          error
          title="攻略内容加载失败"
          description="请稍后刷新页面重试。"
        />
      ) : result.items.length === 0 ? (
        <HomeEmptyState
          title="暂无已发布攻略"
          description="管理员发布攻略后，或执行 seed 数据后会在这里显示。"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {result.items.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      )}
    </HomeSectionShell>
  );
}
