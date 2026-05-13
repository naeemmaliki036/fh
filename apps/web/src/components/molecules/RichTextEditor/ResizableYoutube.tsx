"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import Youtube from "@tiptap/extension-youtube";

function ResizableYoutubeView({
  node,
  updateAttributes,
  selected,
}: ReactNodeViewProps) {
  const [resizing, setResizing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    startX.current = e.clientX;
    startW.current = wrapRef.current?.offsetWidth ?? 640;
  }, []);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const diff = e.clientX - startX.current;
      const newWidth = Math.max(200, startW.current + diff);
      updateAttributes({ width: newWidth, height: Math.round((newWidth * 9) / 16) });
    };
    const onUp = () => setResizing(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [resizing, updateAttributes]);

  const w = (node.attrs.width as number) || 640;
  const h = (node.attrs.height as number) || 360;
  const src = node.attrs.src as string;

  const sizePresets = [
    { label: "S", w: 320 },
    { label: "M", w: 480 },
    { label: "L", w: 640 },
    { label: "XL", w: 800 },
  ];

  return (
    <NodeViewWrapper className="relative inline-block">
      <div
        ref={wrapRef}
        style={{ width: `${w}px`, maxWidth: "100%" }}
        className={`relative ${selected ? "ring-2 ring-primary rounded-md" : ""}`}
      >
        <iframe
          src={src}
          width={w}
          height={h}
          style={{ maxWidth: "100%", borderRadius: "6px" }}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
        {selected && (
          <>
            <div
              onMouseDown={onMouseDown}
              className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-primary/20 hover:bg-primary/40 rounded-r-md"
            />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1 bg-white border border-zinc-200 rounded-md shadow-sm px-1 py-0.5 z-10">
              {sizePresets.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() =>
                    updateAttributes({ width: s.w, height: Math.round((s.w * 9) / 16) })
                  }
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableYoutube = Youtube.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ResizableYoutubeView);
  },
});
