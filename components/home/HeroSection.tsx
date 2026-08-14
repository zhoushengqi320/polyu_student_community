import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { HOME_HERO } from "@/constants/home";
import { isFeatureEnabled } from "@/constants/features";
import { SITE_BYLINE, SITE_SLOGAN } from "@/constants/site";
import { HomeSearchBox } from "@/components/home/HomeSearchBox";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const extraCta = isFeatureEnabled("seasonalGuides")
    ? HOME_HERO.seasonalCta
    : HOME_HERO.secondaryCta;

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col justify-center border-b bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container flex flex-col gap-8 py-10 md:gap-10 md:py-12">
        <div className="max-w-3xl space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-primary">{SITE_SLOGAN}</p>
            <p className="text-xs tracking-[0.08em] text-muted-foreground">
              {SITE_BYLINE}
            </p>
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {HOME_HERO.title}
          </h1>
          <p className="text-lg font-medium text-foreground md:text-xl">
            {HOME_HERO.subtitle}
          </p>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {HOME_HERO.description}
          </p>
        </div>

        <HomeSearchBox className="max-w-2xl" />

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={HOME_HERO.primaryCta.href}>{HOME_HERO.primaryCta.label}</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={HOME_HERO.writeReviewCta.href}>
              {HOME_HERO.writeReviewCta.label}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={extraCta.href}>{extraCta.label}</Link>
          </Button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/80 to-transparent"
        aria-hidden="true"
      />

      <a
        href="#home-content"
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="向下滚动查看更多内容"
      >
        <span className="text-xs tracking-wide">向下探索</span>
        <ChevronDown className="h-4 w-4 motion-safe:animate-bounce" aria-hidden="true" />
      </a>
    </section>
  );
}
