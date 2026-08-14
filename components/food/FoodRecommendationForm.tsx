"use client";

import { useActionState, useState } from "react";
import {
  createFoodRecommendationAction,
  type FoodFormState,
} from "@/lib/food/actions";
import { PendingOverlay } from "@/components/common/PendingOverlay";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type FoodRecommendationFormProps = {
  placeId: string;
};

const initialState: FoodFormState = {};

export function FoodRecommendationForm({ placeId }: FoodRecommendationFormProps) {
  const [state, formAction, pending] = useActionState(
    createFoodRecommendationAction,
    initialState,
  );
  const [rating, setRating] = useState("");
  const [content, setContent] = useState("");

  return (
    <>
      <form action={formAction} className="space-y-3 rounded-lg border p-4">
        <input type="hidden" name="placeId" value={placeId} />
        <div className="space-y-2">
          <Label htmlFor="rating">评分</Label>
          <select
            id="rating"
            name="rating"
            required
            value={rating}
            onChange={(event) => setRating(event.target.value)}
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
          {state.fieldErrors?.rating ? (
            <p className="text-sm text-destructive">{state.fieldErrors.rating}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">推荐内容</Label>
          <textarea
            id="content"
            name="content"
            required
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="分享口味、价格、排队情况、适合场景…"
            className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          {state.fieldErrors?.content ? (
            <p className="text-sm text-destructive">{state.fieldErrors.content}</p>
          ) : null}
        </div>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? (
          <p className="text-sm text-green-600">{state.success}</p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "发布中..." : "发布推荐"}
        </Button>
      </form>
      <PendingOverlay active={pending} label="发布中…" />
    </>
  );
}
