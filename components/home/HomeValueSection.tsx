import { BookOpen, Compass, MessagesSquare, type LucideIcon } from "lucide-react";
import { HOME_VALUE_POINTS } from "@/constants/home";
import { HomeSectionShell } from "@/components/home/HomeSectionShell";

const VALUE_ICONS: LucideIcon[] = [BookOpen, Compass, MessagesSquare];

type HomeValueCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

function HomeValueCard({ title, description, icon: Icon }: HomeValueCardProps) {
  return (
    <article className="relative flex h-full flex-col rounded-xl border border-border/80 bg-card p-6">
      <div
        className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-primary/70 via-primary/40 to-transparent opacity-80"
        aria-hidden="true"
      />

      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

export function HomeValueSection() {
  return (
    <HomeSectionShell
      title="为什么用 PolyUHub"
      description="把散落在群聊、社交平台和口口相传里的校园信息，整理成可搜索、可互动的社区。"
    >
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {HOME_VALUE_POINTS.map((point, index) => (
          <HomeValueCard
            key={point.title}
            title={point.title}
            description={point.description}
            icon={VALUE_ICONS[index] ?? BookOpen}
          />
        ))}
      </div>
    </HomeSectionShell>
  );
}
