import { z } from "zod";
import {
  MARKET_CATEGORIES,
  MARKET_CONDITIONS,
  MARKET_LISTING_STATUSES,
  MARKET_MAX_IMAGES,
  MARKET_TRADE_METHODS,
} from "@/constants/marketOptions";

const categoryIds = MARKET_CATEGORIES.map((item) => item.id) as [
  string,
  ...string[],
];
const conditionIds = MARKET_CONDITIONS.map((item) => item.id) as [
  string,
  ...string[],
];
const tradeMethodIds = MARKET_TRADE_METHODS.map((item) => item.id) as [
  string,
  ...string[],
];
const listingStatusIds = MARKET_LISTING_STATUSES.map((item) => item.id) as [
  string,
  ...string[],
];

function normalizeIdList(raw: unknown): string[] {
  const values =
    typeof raw === "string"
      ? raw.split(",")
      : Array.isArray(raw)
        ? raw.map(String)
        : [];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

const priceSchema = z.preprocess((value) => {
  if (value === "" || value == null) return undefined;
  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }
  return value;
}, z.number().int().min(0, "价格不能为负").max(1_000_000, "价格过高"));

const contactNoteSchema = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}, z.string().max(200, "联系备注最多 200 字").nullable());

const tradeMethodsSchema = z
  .preprocess(normalizeIdList, z.array(z.enum(tradeMethodIds)))
  .refine((items) => items.length > 0, { message: "请至少选择一种交易方式" })
  .refine((items) => items.length <= 2, { message: "交易方式过多" });

const listingFields = {
  title: z
    .string()
    .trim()
    .min(2, "标题至少 2 个字")
    .max(80, "标题最多 80 个字"),
  description: z
    .string()
    .trim()
    .min(10, "描述至少 10 个字")
    .max(5000, "描述最多 5000 个字"),
  priceHkd: priceSchema,
  priceNegotiable: z.preprocess(
    (value) => value === "on" || value === true || value === "true",
    z.boolean(),
  ),
  category: z.enum(categoryIds, { message: "请选择分类" }),
  condition: z.enum(conditionIds, { message: "请选择成色" }),
  tradeMethods: tradeMethodsSchema,
  contactNote: contactNoteSchema,
};

export const createMarketListingSchema = z.object(listingFields);

export const updateMarketListingSchema = z.object({
  ...listingFields,
  listingId: z.string().uuid("无效的闲置 ID"),
  listingStatus: z.enum(listingStatusIds, { message: "请选择在售状态" }),
});

export const updateMarketListingStatusSchema = z.object({
  listingId: z.string().uuid("无效的闲置 ID"),
  listingStatus: z.enum(listingStatusIds, { message: "请选择在售状态" }),
});

export type CreateMarketListingFormValues = z.infer<
  typeof createMarketListingSchema
>;
export type UpdateMarketListingFormValues = z.infer<
  typeof updateMarketListingSchema
>;

export const MARKET_UPLOAD_LIMIT = MARKET_MAX_IMAGES;
