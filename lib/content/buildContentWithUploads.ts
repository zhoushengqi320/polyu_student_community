/** 正文 + 已绑定插图：生成可渲染的 Markdown（图片块置于文末） */
export function buildContentWithUploads(
  text: string,
  uploads: ReadonlyArray<{ publicUrl: string; altText?: string | null }>,
): string {
  const trimmed = text.trim();
  const imageBlocks = uploads
    .map((item) => `![${item.altText?.trim() || "图片"}](${item.publicUrl})`)
    .join("\n\n");

  if (!imageBlocks) {
    return trimmed;
  }

  return trimmed ? `${trimmed}\n\n${imageBlocks}` : imageBlocks;
}

/** 拼接用户正文与插图 Markdown（兼容旧调用） */
export function appendUploadMarkdown(
  text: string,
  markdownBlocks: string,
): string {
  const trimmed = text.trim();
  const blocks = markdownBlocks.trim();
  if (!blocks) return trimmed;
  return trimmed ? `${trimmed}\n\n${blocks}` : blocks;
}
