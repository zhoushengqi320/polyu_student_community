"use client";

import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Image } from "@tiptap/extension-image";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);

  const onResizeStart = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth =
        imgRef.current?.getBoundingClientRect().width ?? node.attrs.width ?? 480;

      setDragging(true);

      const onMove = (moveEvent: PointerEvent) => {
        const nextWidth = Math.max(
          80,
          Math.min(1200, startWidth + (moveEvent.clientX - startX)),
        );
        updateAttributes({ width: Math.round(nextWidth) });
      };

      const onUp = () => {
        setDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [node.attrs.width, updateAttributes],
  );

  const width = node.attrs.width as number | null | undefined;

  return (
    <NodeViewWrapper className="relative my-3 inline-block max-w-full" data-drag-handle>
      <span
        className={cn(
          "relative inline-block max-w-full leading-none",
          selected && "outline outline-2 outline-primary outline-offset-0",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt ?? ""}
          title={node.attrs.title ?? undefined}
          style={width ? { width: `${width}px`, height: "auto" } : undefined}
          className="block h-auto max-w-full"
          draggable={false}
        />
        {selected ? (
          <span
            onPointerDown={onResizeStart}
            className={cn(
              "absolute -bottom-1 -right-1 z-10 h-3.5 w-3.5 cursor-se-resize border-2 border-primary bg-background",
              dragging && "bg-primary",
            )}
            title="拖动边角调整大小"
          />
        ) : null}
      </span>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width") || element.style.width;
          if (!width) return null;
          const parsed = Number.parseInt(width, 10);
          return Number.isFinite(parsed) ? parsed : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
            style: `width: ${attributes.width}px; height: auto; max-width: 100%;`,
          };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
