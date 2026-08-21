import { HOME_HERO } from "@/constants/home";
import { SiteAnnouncementBar } from "@/components/common/SiteAnnouncementBar";
import { type SiteAnnouncement } from "@/types/announcement";

type HeroSectionProps = {
  announcements?: SiteAnnouncement[];
};

export function HeroSection({ announcements = [] }: HeroSectionProps) {
  return (
    <section className="border-b bg-gradient-to-b from-primary/10 via-primary/5 to-background">
      <div className="container flex flex-col gap-6 py-8 md:gap-7 md:py-10">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {HOME_HERO.title}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground md:whitespace-nowrap md:text-lg">
            {HOME_HERO.description}
          </p>
        </div>

        <div className="max-w-2xl">
          <SiteAnnouncementBar announcements={announcements} />
        </div>
      </div>
    </section>
  );
}
