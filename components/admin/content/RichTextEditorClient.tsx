"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { uploadContentImageAction } from "@/lib/content/uploadImageAction";
import { toEditorHtml } from "@/lib/utils/contentFormat";
import { cn } from "@/lib/utils/cn";

type RichTextEditorClientProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

const FONT_SIZES = [
  { label: "字号", value: "" },
  { label: "小", value: "14px" },
  { label: "正常", value: "16px" },
  { label: "大", value: "18px" },
  { label: "更大", value: "20px" },
  { label: "特大", value: "24px" },
];

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40",
        active && "bg-primary/10 text-primary",
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditorClient({
  name,
  value,
  onChange,
  required,
}: RichTextEditorClientProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const refreshToolbar = () => setTick((n) => n + 1);

  const initialHtml = toEditorHtml(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
          rel: "noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class:
            "my-3 h-auto max-h-[28rem] w-full max-w-full rounded-lg border object-contain",
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "在这里直接写正文…可选中文字设标题/字号，或插入图片、表格",
      }),
    ],
    content: initialHtml || "<p></p>",
    editorProps: {
      attributes: {
        class: "prose-editor min-h-[320px] max-w-none px-4 py-3 outline-none",
      },
    },
    onCreate: ({ editor: current }) => {
      hydratedRef.current = true;
      const html = current.getHTML();
      const next = html === "<p></p>" ? "" : html;
      onChange(next);
    },
    onUpdate: ({ editor: current }) => {
      const html = current.getHTML();
      const next = html === "<p></p>" ? "" : html;
      onChange(next);
    },
    onSelectionUpdate: refreshToolbar,
    onTransaction: refreshToolbar,
  });

  useEffect(() => {
    // 切换文章时由父组件 key 强制重建编辑器；此处仅标记已就绪
    if (editor) {
      hydratedRef.current = true;
    }
  }, [editor]);

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("输入链接地址", previous ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }

  function handleUpload(file: File | undefined) {
    if (!file || !editor) return;
    setUploadError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("alt", file.name.replace(/\.[^.]+$/, "") || "图片");

    startUpload(async () => {
      const result = await uploadContentImageAction(formData);
      if (!result.success) {
        setUploadError(result.error);
        return;
      }
      editor.chain().focus().setImage({ src: result.url, alt: "图片" }).run();
    });
  }

  if (!editor) {
    return (
      <div className="min-h-[360px] animate-pulse rounded-lg border border-input bg-muted/30 p-4 text-sm text-muted-foreground">
        正在初始化编辑器…
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-input bg-background">
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1.5">
          <ToolbarButton
            title="撤销"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="重做"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            title="正文"
            active={editor.isActive("paragraph")}
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            <Pilcrow className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="一级标题"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="二级标题"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="三级标题"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-border" />

          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            title="字号"
            value={
              (editor.getAttributes("textStyle").fontSize as string | undefined) ??
              ""
            }
            onChange={(event) => {
              const size = event.target.value;
              if (!size) editor.chain().focus().unsetFontSize().run();
              else editor.chain().focus().setFontSize(size).run();
            }}
          >
            {FONT_SIZES.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <input
            type="color"
            title="文字颜色"
            className="ml-1 h-8 w-8 cursor-pointer rounded-md border border-input bg-background p-1"
            value={
              (editor.getAttributes("textStyle").color as string | undefined) ||
              "#1f2937"
            }
            onChange={(event) =>
              editor.chain().focus().setColor(event.target.value).run()
            }
          />

          <span className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            title="加粗"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="斜体"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="下划线"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="删除线"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            title="左对齐"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="居中"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="右对齐"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            title="无序列表"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="有序列表"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="引用"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="链接"
            active={editor.isActive("link")}
            onClick={setLink}
          >
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="插入表格"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="插入图片"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              handleUpload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>

        <EditorContent editor={editor} />
      </div>

      <input type="hidden" name={name} value={value} required={required} />

      {uploading ? (
        <p className="text-xs text-muted-foreground">图片上传中…</p>
      ) : null}
      {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
    </>
  );
}
