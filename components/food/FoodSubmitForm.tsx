"use client";

import { useActionState } from "react";
import { FOOD_AREAS } from "@/constants/categories";
import {
  submitFoodPlaceAction,
  type FoodFormState,
} from "@/lib/food/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CommunityRulesNotice } from "@/components/legal/CommunityRulesNotice";

const initialState: FoodFormState = {};

export function FoodSubmitForm() {
  const [state, formAction, pending] = useActionState(
    submitFoodPlaceAction,
    initialState,
  );

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>提交新地点</CardTitle>
        <CardDescription>
          提交校园及附近吃喝玩乐地点，并附上你的第一条推荐
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">店名 / 地点名</Label>
            <Input id="name" name="name" required maxLength={100} />
            {state.fieldErrors?.name ? (
              <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="area">地区</Label>
              <select
                id="area"
                name="area"
                required
                defaultValue=""
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  请选择
                </option>
                {FOOD_AREAS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.area ? (
                <p className="text-sm text-destructive">{state.fieldErrors.area}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">你的评分</Label>
              <select
                id="rating"
                name="rating"
                required
                defaultValue=""
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  请选择
                </option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score} 分
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">地址（可选）</Label>
            <Input id="address" name="address" maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">标签（可选，逗号分隔）</Label>
            <Input id="tags" name="tags" placeholder="例如：平价, 日料, 适合聚餐" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">推荐内容</Label>
            <textarea
              id="content"
              name="content"
              required
              rows={5}
              className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="口味、价格、排队、适合场景…"
            />
            {state.fieldErrors?.content ? (
              <p className="text-sm text-destructive">{state.fieldErrors.content}</p>
            ) : null}
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <CommunityRulesNotice message="提交地点与推荐前请遵守社区规则，勿发布虚假或营销导流内容。" />
          <Button type="submit" disabled={pending}>
            {pending ? "提交中..." : "提交地点与推荐"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
