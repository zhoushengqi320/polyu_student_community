import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils/cn";

type MarkdownContentProps = {
  content: string;
  /** 若提供，会去掉正文开头与之相同的一级标题，避免与页头标题重复 */
  stripTitle?: string;
  className?: string;
};

function stripLeadingH1(content: string, title: string): string {
  const normalizedTitle = title.trim();
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/);
  let index = 0;
  while (index < lines.length && !lines[index].trim()) {
    index += 1;
  }

  const heading = lines[index]?.match(/^#\s+(.+)$/);
  if (heading && heading[1].trim() === normalizedTitle) {
    const rest = [...lines.slice(0, index), ...lines.slice(index + 1)];
    return rest.join("\n").replace(/^\s*\n/, "");
  }

  return content;
}

/** 兼容中文序号「1、」写法，转为标准 Markdown 有序列表 */
function normalizeChineseOrderedLists(content: string): string {
  return content.replace(/^(\s*)(\d+)[、．]\s+/gm, "$1$2. ");
}

function prepareMarkdown(content: string, stripTitle?: string): string {
  let next = content.replace(/^\uFEFF/, "");
  if (stripTitle) {
    next = stripLeadingH1(next, stripTitle);
  }
  return normalizeChineseOrderedLists(next);
}

/**
 * 攻略 / 指南正文 Markdown 渲染。
 * 支持：标题、段落、加粗/斜体/删除线、引用、列表（含任务列表）、
 * 链接、图片、表格、行内代码、代码块、分隔线；GFM 扩展。
 */
export function MarkdownContent({
  content,
  stripTitle,
  className,
}: MarkdownContentProps) {
  const markdown = prepareMarkdown(content, stripTitle);

  return (
    <div
      className={cn(
        "markdown-body space-y-4 text-sm leading-7 md:text-base",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="scroll-mt-24 text-2xl font-semibold tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="scroll-mt-24 text-lg font-semibold">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="scroll-mt-24 text-base font-semibold">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium text-muted-foreground">
              {children}
            </h6>
          ),
          p: ({ children }) => <p className="leading-7">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="break-words font-medium text-primary underline underline-offset-2 hover:opacity-90"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => (
            <del className="text-muted-foreground line-through">{children}</del>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 bg-muted/40 px-4 py-2 text-muted-foreground">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1.5 pl-5 marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children, className: liClassName }) => (
            <li className={cn("leading-7 [&>p]:my-1", liClassName)}>{children}</li>
          ),
          hr: () => <hr className="border-border" />,
          img: ({ src, alt }) => {
            if (!src || typeof src !== "string") {
              return null;
            }
            return (
              // 攻略图源可为外链或 /public 相对路径；不用 next/image 以免限制域名
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt ?? ""}
                loading="lazy"
                className="content-image my-3 h-auto max-w-full cursor-zoom-in border border-border"
              />
            );
          },
          table: ({ children }) => (
            <div className="my-4 w-full overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/60">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-border last:border-b-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top text-muted-foreground">
              {children}
            </td>
          ),
          code: ({ className: codeClassName, children }) => {
            const isBlock = Boolean(codeClassName?.includes("language-"));
            if (isBlock) {
              return (
                <code className={cn("font-mono text-[0.85em]", codeClassName)}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-[0.85em] leading-6">
              {children}
            </pre>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
