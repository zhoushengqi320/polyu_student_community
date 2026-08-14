import DOMPurify from "isomorphic-dompurify";
import { ImageLightbox } from "@/components/common/ImageLightbox";
import { MarkdownContent } from "@/components/guides/MarkdownContent";
import {
  looksLikeHtml,
  stripLeadingTitleHtml,
} from "@/lib/utils/contentFormat";
import { cn } from "@/lib/utils/cn";

type RichContentProps = {
  content: string;
  stripTitle?: string;
  className?: string;
};

/** 前台正文：新内容为 TipTap HTML；旧内容仍走 Markdown */
export function RichContent({ content, stripTitle, className }: RichContentProps) {
  if (!content?.trim()) {
    return null;
  }

  if (!looksLikeHtml(content)) {
    return (
      <ImageLightbox>
        <MarkdownContent
          content={content}
          stripTitle={stripTitle}
          className={className}
        />
      </ImageLightbox>
    );
  }

  let html = content;
  if (stripTitle) {
    html = stripLeadingTitleHtml(html, stripTitle);
  }

  const safe = DOMPurify.sanitize(html, {
    ADD_ATTR: ["width", "height", "style"],
  });

  return (
    <ImageLightbox>
      <div
        className={cn("prose-editor rich-content text-sm md:text-base", className)}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    </ImageLightbox>
  );
}
