import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-bold">页面不存在</h1>
      <p className="max-w-md text-muted-foreground">
        你访问的页面可能已被删除，或链接地址有误。
      </p>
      <Button asChild>
        <Link href={ROUTES.home}>返回首页</Link>
      </Button>
    </div>
  );
}
