"use client";

import { useActionState, useState } from "react";
import { StarRatingInput } from "@/components/courses/StarRatingInput";
import {
  createFoodRecommendationAction,
  type FoodFormState,
} from "@/lib/food/actions";
import {
  FormImageAttachments,
  type FormImageUploadItem,
} from "@/components/common/FormImageAttachments";
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
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [uploads, setUploads] = useState<FormImageUploadItem[]>([]);

  return (
    <>
      <form action={formAction} className="space-y-3 rounded-lg border p-4">
        <input type="hidden" name="placeId" value={placeId} />
        <StarRatingInput
          id="rating"
          name="rating"
          label="评分"
          value={rating}
          onChange={setRating}
          error={state.fieldErrors?.rating}
        />
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
        <FormImageAttachments
          module="food"
          uploads={uploads}
          onChange={setUploads}
          disabled={pending}
          hint="可上传最多 3 张图片，单张不超过 5MB。选择后立即上传，发布推荐时自动附在正文末尾。"
        />
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
