import { z } from "zod";
import { GUIDE_CATEGORIES } from "@/constants/guides";

const categoryIds = GUIDE_CATEGORIES.map((item) => item.id) as [
  string,
  ...string[],
];

const sourceLinkSchema = z.object({
  label: z.string().trim().min(1, "链接名称不能为空").max(100),
  url: z.string().trim().url("请输入有效 URL"),
});

function parseSourceLinks(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const guideFieldsSchema = {
  title: z
    .string()
    .trim()
    .min(2, "标题至少 2 个字")
    .max(200, "标题最多 200 个字"),
  excerpt: z
    .string()
    .trim()
    .max(300, "摘要最多 300 个字")
    .optional()
    .nullable(),
  content: z
    .string()
    .trim()
    .min(10, "正文至少 10 个字")
    .max(100000, "正文最多 100000 个字"),
  category: z
    .enum(categoryIds, { message: "请选择有效分类" })
    .optional()
    .default("admission"),
  sourceLinks: z.preprocess(
    parseSourceLinks,
    z.array(sourceLinkSchema).max(10, "最多添加 10 个参考链接"),
  ),
};

export const createGuideSchema = z.object(guideFieldsSchema);

export const updateGuideSchema = z.object({
  ...guideFieldsSchema,
  guideId: z.string().uuid("无效的攻略 ID"),
});

export type CreateGuideFormValues = z.infer<typeof createGuideSchema>;
export type UpdateGuideFormValues = z.infer<typeof updateGuideSchema>;

export function parseGuideFormData(formData: FormData, mode: "create" | "update") {
  const payload = {
    title: formData.get("title"),
    excerpt: formData.get("excerpt") || null,
    content: formData.get("content"),
    category: formData.get("category") || "admission",
    sourceLinks: formData.get("sourceLinks"),
    ...(mode === "update"
      ? { guideId: formData.get("guideId") }
      : {}),
  };

  const schema = mode === "update" ? updateGuideSchema : createGuideSchema;
  return schema.safeParse(payload);
}
