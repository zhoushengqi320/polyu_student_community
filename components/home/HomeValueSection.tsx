import { HOME_VALUE_POINTS } from "@/constants/home";
import { HomeSectionShell } from "@/components/home/HomeSectionShell";

export function HomeValueSection() {
  return (
    <HomeSectionShell
      title="为什么用 PolyUHub"
      description="把散落在群聊、社交平台和口口相传里的校园信息，整理成可搜索、可互动的社区。"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {HOME_VALUE_POINTS.map((point) => (
          <div key={point.title} className="space-y-2">
            <h3 className="text-base font-semibold tracking-tight">{point.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {point.description}
            </p>
          </div>
        ))}
      </div>
    </HomeSectionShell>
  );
}
