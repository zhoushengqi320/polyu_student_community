"use client";

import { useActionState, useState } from "react";
import {
  FormImageAttachments,
  type FormImageUploadItem,
} from "@/components/common/FormImageAttachments";
import { PendingOverlay } from "@/components/common/PendingOverlay";
import { CommunityRulesNotice } from "@/components/legal/CommunityRulesNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MARKET_CATEGORIES,
  MARKET_CONDITIONS,
  MARKET_LISTING_STATUSES,
  MARKET_MAX_IMAGES,
  MARKET_TRADE_METHODS,
} from "@/constants/marketOptions";
import {
  createMarketListingAction,
  updateMarketListingAction,
  type MarketFormState,
} from "@/lib/market/actions";
import { type MarketListingWithAuthor } from "@/types/market";

type MarketListingFormProps = {
  mode: "create" | "edit";
  initial?: MarketListingWithAuthor;
};

const initialState: MarketFormState = {};

export function MarketListingForm({ mode, initial }: MarketListingFormProps) {
  const action =
    mode === "create" ? createMarketListingAction : updateMarketListingAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceHkd, setPriceHkd] = useState(
    initial ? String(initial.priceHkd) : "",
  );
  const [priceNegotiable, setPriceNegotiable] = useState(
    initial?.priceNegotiable ?? false,
  );
  const [category, setCategory] = useState(initial?.category ?? "");
  const [condition, setCondition] = useState(initial?.condition ?? "");
  const [tradeMethods, setTradeMethods] = useState<string[]>(
    (initial?.tradeMethods ?? []).filter((id) =>
      MARKET_TRADE_METHODS.some((item) => item.id === id),
    ),
  );
  const [contactNote, setContactNote] = useState(initial?.contactNote ?? "");
  const [listingStatus, setListingStatus] = useState<
    (typeof MARKET_LISTING_STATUSES)[number]["id"]
  >(initial?.listingStatus ?? "available");
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(
    initial?.imageUrls ?? [],
  );
  const [uploads, setUploads] = useState<FormImageUploadItem[]>([]);

  function toggleTradeMethod(id: string) {
    setTradeMethods((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>{mode === "create" ? "发布闲置" : "编辑闲置"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {mode === "edit" && initial ? (
              <input type="hidden" name="listingId" value={initial.id} />
            ) : null}
            {existingImageUrls.map((url) => (
              <input
                key={url}
                type="hidden"
                name="existingImageUrls"
                value={url}
              />
            ))}

            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                name="title"
                required
                maxLength={80}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例如：COMP2011 教材 9 成新"
              />
              {state.fieldErrors?.title ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.title}
                </p>
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
                  {MARKET_CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">成色</Label>
                <select
                  id="condition"
                  name="condition"
                  required
                  value={condition}
                  onChange={(event) => setCondition(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="" disabled>
                    请选择
                  </option>
                  {MARKET_CONDITIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceHkd">价格（港币，0 表示赠送）</Label>
              <Input
                id="priceHkd"
                name="priceHkd"
                type="number"
                min={0}
                max={1000000}
                required
                value={priceHkd}
                onChange={(event) => setPriceHkd(event.target.value)}
              />
              {state.fieldErrors?.priceHkd ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.priceHkd}
                </p>
              ) : null}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="priceNegotiable"
                value="on"
                checked={priceNegotiable}
                onChange={(event) => setPriceNegotiable(event.target.checked)}
              />
              价格可议
            </label>

            <div className="space-y-2">
              <Label>交易方式（可多选）</Label>
              <div className="flex flex-wrap gap-3">
                {MARKET_TRADE_METHODS.map((item) => (
                  <label
                    key={item.id}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="tradeMethods"
                      value={item.id}
                      checked={tradeMethods.includes(item.id)}
                      onChange={() => toggleTradeMethod(item.id)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              {state.fieldErrors?.tradeMethods ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.tradeMethods}
                </p>
              ) : null}
            </div>

            {mode === "edit" ? (
              <div className="space-y-2">
                <Label htmlFor="listingStatus">在售状态</Label>
                <select
                  id="listingStatus"
                  name="listingStatus"
                  value={listingStatus}
                  onChange={(event) =>
                    setListingStatus(
                      event.target
                        .value as (typeof MARKET_LISTING_STATUSES)[number]["id"],
                    )
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {MARKET_LISTING_STATUSES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <textarea
                id="description"
                name="description"
                required
                rows={6}
                maxLength={5000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="说明成色、购入时间、瑕疵、交易时间偏好等"
                className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {state.fieldErrors?.description ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.description}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNote">联系备注（可选）</Label>
              <Input
                id="contactNote"
                name="contactNote"
                maxLength={200}
                value={contactNote}
                onChange={(event) => setContactNote(event.target.value)}
              />
            </div>

            {existingImageUrls.length > 0 ? (
              <div className="space-y-2">
                <Label>已有图片</Label>
                <div className="flex flex-wrap gap-2">
                  {existingImageUrls.map((url) => (
                    <div key={url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="h-20 w-20 rounded-md object-cover"
                      />
                      <button
                        type="button"
                        className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground"
                        onClick={() =>
                          setExistingImageUrls((current) =>
                            current.filter((item) => item !== url),
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <FormImageAttachments
              module="market"
              uploads={uploads}
              onChange={setUploads}
              disabled={pending}
              label="商品图片（可选）"
              hint={`可上传最多 ${MARKET_MAX_IMAGES} 张，含已有图片；单张不超过 5MB。`}
            />

            <CommunityRulesNotice message="发布闲置前请遵守社区规则；线下交易请自行甄别，平台不提供担保。" />

            {state.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p className="text-sm text-green-600">{state.success}</p>
            ) : null}

            <Button type="submit" disabled={pending}>
              {pending
                ? "提交中..."
                : mode === "create"
                  ? "发布闲置"
                  : "保存修改"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <PendingOverlay
        active={pending}
        label={mode === "create" ? "发布中…" : "保存中…"}
      />
    </>
  );
}
