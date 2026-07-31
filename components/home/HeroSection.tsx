import Link from "next/link";
import { HOME_HERO } from "@/constants/home";
import { isFeatureEnabled } from "@/constants/features";
import { SITE_SLOGAN } from "@/constants/site";
import { HomeSearchBox } from "@/components/home/HomeSearchBox";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const extraCta = isFeatureEnabled("seasonalGuides")
    ? HOME_HERO.seasonalCta
    : HOME_HERO.secondaryCta;

  return (
    <section className="border-b bg-gradient-to-b from-primary/5 to-background">
      <div className="container flex flex-col gap-8 py-14 md:py-20">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-medium text-primary">{SITE_SLOGAN}</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {HOME_HERO.title}
          </h1>
          <p className="text-lg font-medium text-foreground">{HOME_HERO.subtitle}</p>
          <p className="text-base text-muted-foreground">{HOME_HERO.description}</p>
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
    </section>
  );
}
