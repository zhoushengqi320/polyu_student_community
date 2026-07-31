import { marked } from "marked";

/** 粗略判断正文是否已是 HTML（TipTap 保存格式） */
export function looksLikeHtml(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  // 以常见块级标签开头，避免把 Markdown 误判成 HTML
  return /^<(?:p|h[1-6]|ul|ol|li|table|thead|tbody|tr|td|th|div|blockquote|img|figure|pre|hr)\b/i.test(
    trimmed,
  );
}

/** 编辑器加载：旧 Markdown 转为 HTML；已是 HTML 则原样 */
export function toEditorHtml(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (looksLikeHtml(trimmed)) return trimmed;

  marked.setOptions({ gfm: true, breaks: true });
  return marked.parse(trimmed, { async: false }) as string;
}

/** 去掉与标题重复的开头 h1（详情页顶栏已有标题） */
export function stripLeadingTitleHtml(html: string, title: string): string {
  const normalized = title.trim();
  if (!normalized || !html.trim()) return html;

  return html.replace(
    new RegExp(
      `^\\s*<h1[^>]*>\\s*${escapeRegExp(normalized)}\\s*<\\/h1>\\s*`,
      "i",
    ),
    "",
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
