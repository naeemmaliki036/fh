"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import ImageExt from "@tiptap/extension-image";

function ResizableImageView({
  node,
  updateAttributes,
  selected,
}: ReactNodeViewProps) {
  const [resizing, setResizing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    startX.current = e.clientX;
    startW.current = imgRef.current?.offsetWidth ?? 300;
  }, []);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const diff = e.clientX - startX.current;
      const newWidth = Math.max(100, startW.current + diff);
      updateAttributes({ width: newWidth });
    };
    const onUp = () => setResizing(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [resizing, updateAttributes]);

  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string) || "";
  const width = node.attrs.width as number | null;

  return (
    <NodeViewWrapper className="relative inline-block" data-drag-handle>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width ?? undefined}
        style={{ width: width ? `${width}px` : undefined, maxWidth: "100%" }}
        className={`rounded-md ${selected ? "ring-2 ring-primary" : ""}`}
        draggable={false}
      />
      {selected && (
        <>
          <div
            onMouseDown={onMouseDown}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-primary/20 hover:bg-primary/40 rounded-r-md"
          />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1 bg-white border border-zinc-200 rounded-md shadow-sm px-1 py-0.5 z-10">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  const containerWidth =
                    imgRef.current?.parentElement?.parentElement?.offsetWidth ?? 800;
                  updateAttributes({ width: Math.round(containerWidth * (pct / 100)) });
                }}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </>
      )}
    </NodeViewWrapper>
  );
}

export const ResizableImage = ImageExt.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.width ? { width: attrs.width } : {},
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
