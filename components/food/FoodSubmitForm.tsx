"use client";

import { useActionState, useState } from "react";
import { FOOD_AREAS } from "@/constants/categories";
import { FOOD_CATEGORIES } from "@/constants/foodCategories";
import { StarRatingInput } from "@/components/courses/StarRatingInput";
import {
  submitFoodPlaceAction,
  type FoodFormState,
} from "@/lib/food/actions";
import {
  FormImageAttachments,
  type FormImageUploadItem,
} from "@/components/common/FormImageAttachments";
import { PendingOverlay } from "@/components/common/PendingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [address, setAddress] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [uploads, setUploads] = useState<FormImageUploadItem[]>([]);

  return (
    <>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>提交新地点</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">店名 / 地点名</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {state.fieldErrors?.name ? (
                <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <select
                  id="category"
                  name="category"
                  required
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="" disabled>
                    请选择
                  </option>
                  {FOOD_CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.category ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.category}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">地区</Label>
                <select
                  id="area"
                  name="area"
                  required
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
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
            </div>
            <StarRatingInput
              id="rating"
              name="rating"
              label="你的评分"
              value={rating}
              onChange={setRating}
              error={state.fieldErrors?.rating}
              className="sm:max-w-sm"
            />
            <div className="space-y-2">
              <Label htmlFor="address">地址（可选）</Label>
              <Input
                id="address"
                name="address"
                maxLength={200}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">标签（可选，逗号分隔）</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="例如：平价, 适合聚餐"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">推荐内容</Label>
              <textarea
                id="content"
                name="content"
                required
                rows={5}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="口味、价格、排队、适合场景…"
              />
              {state.fieldErrors?.content ? (
                <p className="text-sm text-destructive">{state.fieldErrors.content}</p>
              ) : null}
            </div>
            <FormImageAttachments
              module="food"
              uploads={uploads}
              onChange={setUploads}
              disabled={pending}
              label="地点照片（可选）"
              hint="可上传门头、环境、餐牌等，最多 3 张，单张不超过 5MB。"
            />
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
      <PendingOverlay active={pending} label="提交中…" />
    </>
  );
}
