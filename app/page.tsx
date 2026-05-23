import Link from "next/link";
import { CORE_MODULES } from "@/constants/modules";
import { ROUTES } from "@/constants/routes";
import { SITE_NAME, SITE_SLOGAN } from "@/constants/site";
import { ModuleCard } from "@/components/common/ModuleCard";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div>
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container flex flex-col gap-6 py-16 md:py-24">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-medium text-primary">{SITE_SLOGAN}</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              欢迎来到{SITE_NAME}
            </h1>
            <p className="text-lg text-muted-foreground">
              课程评价、入学攻略、美食推荐、常用网站、找搭子、自由讨论区 —
              为理大学生打造的一站式社区平台。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={ROUTES.courses.list}>浏览课程评价</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.guides.list}>查看入学攻略</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl font-bold">六大核心模块</h2>
          <p className="text-muted-foreground">
            每个模块独立维护，后续将逐个接入数据库与业务功能。
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_MODULES.map((module) => (
            <ModuleCard
              key={module.key}
              moduleKey={module.key}
              route={module.route}
              label={module.label}
              description={module.description}
              icon={module.icon}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
