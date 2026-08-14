"use client";

import { useState } from "react";
import { FoodRecommendationForm } from "@/components/food/FoodRecommendationForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

type FoodRecommendSectionProps = {
  placeId: string;
  canRecommend: boolean;
};

export function FoodRecommendSection({
  placeId,
  canRecommend,
}: FoodRecommendSectionProps) {
  const [open, setOpen] = useState(false);

  if (!canRecommend) {
    return (
      <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        <Link href={ROUTES.login} className="font-medium text-primary hover:underline">
          登录
        </Link>{" "}
        后即可写下推荐
      </p>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        写一条推荐
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">写一条推荐</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          收起
        </Button>
      </div>
      <FoodRecommendationForm placeId={placeId} />
    </div>
  );
}
